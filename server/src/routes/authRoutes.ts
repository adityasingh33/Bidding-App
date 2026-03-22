import { Router } from "express"
import { register } from "../controllers/register.ts"
import { login } from "../controllers/login.ts"

const router = Router()

router.post("/register", register)
router.post("/login", login)

export default router
