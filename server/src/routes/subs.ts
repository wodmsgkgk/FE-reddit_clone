import { Router } from "express"
import { Request, Response } from "express";
import userMiddleWare from "../middlewares/user"
import authMiddleWare from "../middlewares/auth"
import { isEmpty } from "class-validator";
import { AppDataSource } from "../data-source";
import Sub from "../entities/Sub";
import { User } from "../entities/User";
import Post from "../entities/Post";

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

const topSubs = async (req: Request, res: Response) => {
    try {
        const imageUrlExp = `COALESCE('${process.env.APP_URL}/images/' ||s."imageUrn",'https://www.gravatar.com/avatar?d=mp&f=y')`;
        const subs = await AppDataSource.createQueryBuilder()
            .select(
                `s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`
            )
            .from(Sub, "s")
            .leftJoin(Post, "p", `s.name = p."subName"`)
            .groupBy('s.title, s.name, "imageUrl"')
            .orderBy(`"postCount"`, "DESC")
            .limit(5)
            .execute();
        return res.json(subs);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "문제가 발생했습니다." });
    }
};

const router = Router()

router.post("/", userMiddleWare, authMiddleWare, createSub)
router.get("/sub/topSubs", topSubs)

export default router