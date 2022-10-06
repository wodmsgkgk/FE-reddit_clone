import { Router } from "express"
import { Request, Response } from "express";
import userMiddleWare from "../middlewares/user"
import authMiddleWare from "../middlewares/auth"
import { isEmpty } from "class-validator";
import { AppDataSource } from "../data-source";
import Sub from "../entities/Sub";
import { User } from "../entities/User";

const createSub = async (req: Request, res: Response, next) => {
    const { name, title, description } = req.body
    console.log("createSub" + name + "/" + title + "/" + description + "/")

    try {
        let errors: any = {};
        if (isEmpty(name)) errors.name = "이름은 비워둘 수 없습니다."
        if (isEmpty(title)) errors.title = "제목은 비워둘 수 없습니다."

        const sub = await AppDataSource
            .getRepository(Sub)
            .createQueryBuilder("sub")
            .where("lower(sub.name) = :name", { name: name.toLowerCase() })
            .getOne()

        if (sub) errors.name = "서브가 이미 존재합니다."

        if (Object.keys(errors).length > 0) {
            throw errors;
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "문제가 발생했습니다." });
    }

    try {
        const user: User = res.locals.user

        const sub = new Sub()
        sub.name = name
        sub.title = title
        sub.description = description
        sub.user = user

        await sub.save()

        return res.json(sub)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "문제가 발생했습니다." });
    }

}

const router = Router()



router.post("/", userMiddleWare, authMiddleWare, createSub)

export default router