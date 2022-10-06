import { isEmpty, validate } from "class-validator";
import { Request, Response, Router } from "express";
import { User } from "../entities/User";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import cookie from "cookie"
import userMiddleWare from "../middlewares/user"
import authMiddleWare from "../middlewares/auth"

const mapErrors = (errors: Object[]) => {
    return errors.reduce((prev: any, err: any) => {
        prev[err.property] = Object.entries(err.constraints)[0][1]
        return prev
    }, {})
}

const register = async (req: Request, res: Response) => {
    const { email, username, password } = req.body
    console.log(email, username, password)

    try {
        let errors: any = {};

        //이메일과 유저이름이 이미 저장 사용되고 있는 것인지 확인.
        const emailUser = await User.findOneBy({ email })
        const usernameUser = await User.findOneBy({ username })

        if (emailUser) errors.email = "이미 해당 이메일 주소가 사용되었습니다."
        if (usernameUser) errors.username = "이미 이 사용자 이름이 사용되었습니다."

        if (Object.keys(errors).length > 0) {
            return res.status(400).json(errors)
        }

        const user = new User()
        user.email = email
        user.username = username
        user.password = password

        errors = await validate(user)

        if (errors.length > 0) return res.status(400).json(mapErrors(errors))

        await user.save()

        return res.json(user)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })

    }
}
const login = async (req: Request, res: Response) => {
    const { username, password } = req.body
    console.log(username, password)

    try {
        let errors: any = {};

        //유효성 검증
        if (isEmpty(username)) errors.username = "사용자 이름은 비워둘 수 없습니다."
        if (isEmpty(password)) errors.password = "비밀번호는 비워둘 수 없습니다."

        if (Object.keys(errors).length > 0) {
            return res.status(400).json(errors)
        }

        //유저 찾기
        const user = await User.findOneBy({ username })

        if (!user) return res.status(400).json({ username: "사용자 이름이 등록되지 않았습니다." })

        //비번 비교
        const passwordMatches = await bcrypt.compare(password, user.password)

        if (!passwordMatches) {
            return res.status(400).json({ password: "비밀번호가 잘못되었습니다." })
        }

        //쿠키저장
        const token = jwt.sign({ username }, process.env.JWT_SECRET)

        res.set(
            "Set-Cookie",
            cookie.serialize("token", token, {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, //1week
                path: "/",
            })
        );

        return res.json({ user, token })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })

    }
}

const me = async (_: Request, res: Response) => {
    return res.json(res.locals.user)
}

const router = Router()
router.post("/register", register)
router.post("/login", login)
router.post("/me", userMiddleWare, authMiddleWare, me)

export default router