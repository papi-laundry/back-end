const { comparePassword } = require("../helpers/bcrypt");
const { createToken } = require("../helpers/jwt");
const { UserProfile, User } = require("../models/index");
const cloudinary = require('../config/cloudinary')

class UserController {
  static async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body
      
      const user = await User.create({
        username,
        email,
        password,
        role
      })

      const userProfile = await UserProfile.create({
        name: user.username,
        userId: user.id
      })

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: userProfile.name,
        createdAt: user.createdAt
      })
    } catch (error) {
      next(error)
    }
  }

  static async login(req, res, next) {
    try {
      const { usernameOrEmail, password } = req.body
      if (!usernameOrEmail) throw { name: "InvalidLogin" }

      let user = await User.findOne({
        where: {
          email: usernameOrEmail.toLowerCase(),
        }
      })

      if (!user) {
        user = await User.findOne({
          where: {
            username: usernameOrEmail.toLowerCase(),
          }
        })

        if (!user) {
          throw { name: "InvalidLogin" };
        }
      }

      const isLogin = comparePassword(password, user.password)
      if (isLogin !== true) {
        throw { name: "InvalidLogin" };
      }
      
      const token = createToken({
        id: user.id
      })
      res.status(200).json({ access_token : token })
    } catch (error) {
      next(error)
    }
  }

  static async update(req, res) {
    const { name } = req.body;
    const { id } = req.user;

    const queryUpdate = {
      name
    }

    if(req.file) {
      const { mimetype, buffer, originalname } = req.file;
      const file = "data:" + mimetype + ";base64," + buffer.toString("base64")
  
      const response = await cloudinary.v2.uploader.upload(file, { public_id: originalname })
      if(!response.url) throw { name: "NetworkIssues" }

      queryUpdate.image = response.url
    }

    await UserProfile.update(queryUpdate, {
      where: {
        userId: id,
      },
    })

    const profile = await UserProfile.findOne({
      where: {
        userId: id,
      }
    })

    res.status(200).json({
      id: profile.id,
      name: profile.name,
      image: profile.image,
      updatedAt: profile.updatedAt,
    })
  }

  static async get(req, res) {
    const { id } = req.user

    const profile = await UserProfile.findOne({ 
      where: {
        userId: id
      },
      include: {
        model: User,
        attributes: {
          exclude: ['password']
        }
      }
    })

    res.status(200).json(profile)
  }
}

module.exports = UserController;
