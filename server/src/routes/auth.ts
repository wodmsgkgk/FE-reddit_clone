import { Request, Response, Router } from "express";

const register = async (req: Request, res: Response) => {
    const { email, userName, password } = req.body
    console.log(email, userName, password)
}

const router = Router()
router.post("/register", register)

export default router