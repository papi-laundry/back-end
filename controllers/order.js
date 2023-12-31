const { Order, UserProfile, Product, Laundry } = require('../models/index')
const { Op } = require('sequelize');

class OrderController {
  static async getMy(req, res, next) {
    try {
      const { id } = req.user

      const orders = await Order.findAll({
        where: {
          clientId: id
        },
        include: [
          {
            model: UserProfile,
          },
          {
            model: Product,
            include: {
              model: Laundry,
              as: 'laundry'
            }
          }
        ],
        order: [
          ["createdAt", "DESC"]
        ]
      })

      res.status(200).json(orders)
    } catch (error) {
      next(error)
    }
  }

  static async create(req, res, next) {
    try {
      const { productId } = req.params
      if(!Number(productId)) throw { name: "NotFound" }

      const product = await Product.findOne({
        where: {
          id: productId
        },
        include: {
          model: Laundry,
          as: 'laundry'
        }
      })
      if(!product) throw { name: "NotFound" }

      const { id } = req.user
      const { totalUnit, notes, method, destination } = req.body

      const user = await UserProfile.findOne({
        where: {
          userId: id
        }
      })
      if(user.balance < product.price) throw { name: "InvalidBalance" }
      if(user.id === product.laundry.ownerId) throw { name: "Forbidden" }

      const queryCreate = {
        productId,
        clientId: id,
        totalUnit,
        notes,
        method,
        destination
      }

      if(req.body.coordinates) {
        const coordinates = JSON.parse(req.body.coordinates)
        const latitude = coordinates.latitude
        const longitude = coordinates.longitude
        const destinationPoint = {
          type: 'Point',
          coordinates: [latitude, longitude]
        }

        queryCreate.destinationPoint = destinationPoint
      }

      const order = await Order.create(queryCreate)

      await UserProfile.update({
        balance: user.balance - (product.price * order.totalUnit)
      }, {
        where: {
          userId: id
        }
      })

      res.status(201).json({
        id: order.id,
        productId: order.productId,
        clientId: order.clientId,
        totalUnit: order.totalUnit,
        notes: order.notes,
        method: order.method,
        destination: order.destination,
        status: order.status,
        destinationPoint: order.destinationPoint,
        createdAt: order.createdAt
      })
    } catch (error) {
      next(error)
    }
  }

  static async payship(req, res, next) {
    try {
      const { id } = req.user
      const { pay } = req.body

      const user = await UserProfile.findOne({
        where: {
          userId: id
        }
      })

      await UserProfile.update({
        balance: user.balance - pay
      }, {
        where: {
          userId: id
        }
      })

      res.status(200).json({ message: "Success create order with payship" })
    } catch (error) {
      next(error)
    }
  }

  static async getNotifications(req, res, next) {
    try {
      const { id, role } = req.user

      const query = {
        include: [
          {
            model: UserProfile,
          },
          {
            model: Product,
            include: {
              model: Laundry,
              as: 'laundry'
            }
          }
        ],
        order: [
          ["updatedAt", "DESC"]
        ]
      }

      if(role === "owner") {
        const user = await UserProfile.findOne({
          where: {
            userId: id
          }
        })

        const laundry = await Laundry.findOne({
          where: {
            ownerId: user.id
          }
        })

          const products = await Product.findAll({
            where: {
              laundryId: laundry ? laundry.id : 0
            }
          })

          const indikator = products.map(product => {
            return product.id
          });

          query.where = {
            [Op.or]: {
              productId: {
                [Op.in]: indikator
              },
              clientId: id
            }
          }

      } else {
        query.where = {
          clientId: id
        }
      }


      const orders = await Order.findAll(query)

      res.status(200).json(orders)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  static async get(req, res, next) {
    try {
      const { laundryId } = req.params
      if(!Number(laundryId)) throw { name: "NotFound" }

      const orders = await Order.findAll({
        include: [
          {
            model: UserProfile,
          },
          {
            model: Product,
            where: {
              laundryId: laundryId
            },
            include: {
              model: Laundry,
              as: 'laundry'
            }
          }
        ]
      })

      res.status(200).json(orders)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.user
      const { orderId } = req.params
      if(!Number(orderId)) throw { name: "NotFound" }

      const { rating, status } = req.body
      let order = await Order.findByPk(orderId)
      if(!order) throw { name: "NotFound" }

      if(order.clientId !== id) throw { name: "Forbidden" }

      await Order.update({
        rating,
        status
      }, {
        where: {
          id: orderId
        }
      })

      const product = await Product.findOne({
        where: {
          id: order.productId
        },
        include: [
          {
            model: Laundry,
            as: 'laundry'
          }
        ]
      })

      let profile = await UserProfile.findByPk(product.laundry.ownerId)
      await UserProfile.update({
        balance: profile.balance + (product.price * order.totalUnit)
      }, {
        where: {
          id: profile.id
        }
      })

      order = await Order.findByPk(orderId)

      res.status(200).json({
        id: order.id,
        productId: order.productId,
        clientId: order.clientId,
        totalUnit: order.totalUnit,
        notes: order.notes,
        method: order.method,
        destination: order.destination,
        status: order.status,
        destinationPoint: order.destinationPoint,
        updatedAt: order.updatedAt
      })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
}

module.exports = OrderController