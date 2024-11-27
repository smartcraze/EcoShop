import { Server, Model, RestSerializer } from "miragejs";
import {
  loginHandler,
  signupHandler,
} from "./backend/controllers/AuthController";
import {
  addItemToCartHandler,
  getCartItemsHandler,
  removeItemFromCartHandler,
  updateCartItemHandler,
} from "./backend/controllers/CartController";
import {
  getAllCategoriesHandler,
  getCategoryHandler,
} from "./backend/controllers/CategoryController";
import {
  getAllProductsHandler,
  getProductHandler,
} from "./backend/controllers/ProductController";
import {
  addItemToWishlistHandler,
  getWishlistItemsHandler,
  removeItemFromWishlistHandler,
} from "./backend/controllers/WishlistController";
import { categories } from "./backend/db/categories";
import { products } from "./backend/db/products";
import { users } from "./backend/db/users";

export function makeServer({ environment = "development" } = {}) {
  return new Server({
    serializers: {
      application: RestSerializer,
    },
    environment,
    models: {
      product: Model,
      category: Model,
      user: Model,
      cart: Model,
      wishlist: Model,
      order: Model,
    },

    // Runs on the start of the server
    seeds(server) {
      // Disable console logs from Mirage
      server.logging = false;

      // Seed products
      products.forEach((item) => {
        server.create("product", { ...item });
      });

      // Seed users with empty cart and wishlist
      users.forEach((item) =>
        server.create("user", { 
          ...item, 
          cart: [], 
          wishlist: [],
          orders: []
        })
      );

      // Seed categories
      categories.forEach((item) => server.create("category", { ...item }));
    },

    routes() {
      // Passthrough external domains to prevent interception
      this.passthrough('https://checkout.razorpay.com/**');
      this.passthrough('https://api.razorpay.com/**');
      this.passthrough('https://lumberjack.razorpay.com/**');
      
      // Allow all fetch/xhr requests to external domains in development
      this.passthrough((request) => {
        const externalDomains = [
          'https://checkout.razorpay.com',
          'https://api.razorpay.com',
          'https://lumberjack.razorpay.com'
        ];
        
        return externalDomains.some(domain => 
          request.url.startsWith(domain)
        );
      });

      // Set namespace for API routes
      this.namespace = "api";

      // Authentication Routes
      this.post("/auth/signup", signupHandler.bind(this));
      this.post("/auth/login", loginHandler.bind(this));

      // Product Routes
      this.get("/products", getAllProductsHandler.bind(this));
      this.get("/products/:productId", getProductHandler.bind(this));

      // Category Routes
      this.get("/categories", getAllCategoriesHandler.bind(this));
      this.get("/categories/:categoryId", getCategoryHandler.bind(this));

      // Cart Routes
      this.get("/user/cart", getCartItemsHandler.bind(this));
      this.post("/user/cart", addItemToCartHandler.bind(this));
      this.post("/user/cart/:productId", updateCartItemHandler.bind(this));
      this.delete(
        "/user/cart/:productId",
        removeItemFromCartHandler.bind(this)
      );

      // Wishlist Routes
      this.get("/user/wishlist", getWishlistItemsHandler.bind(this));
      this.post("/user/wishlist", addItemToWishlistHandler.bind(this));
      this.delete(
        "/user/wishlist/:productId",
        removeItemFromWishlistHandler.bind(this)
      );

      // Mock Payment and Order Routes
      this.post("/payments/process", (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        
        // Generate a mock order
        const order = schema.create('order', {
          id: Math.random().toString(36).substr(2, 9),
          paymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
          amount: attrs.amount,
          items: attrs.items || [],
          createdAt: new Date().toISOString(),
          status: 'completed'
        });

        return {
          status: "success",
          message: "Payment processed successfully",
          orderId: order.id,
          paymentId: order.paymentId,
          amount: attrs.amount
        };
      });

      // Order Routes
      this.get("/orders", (schema) => {
        return schema.orders.all();
      });

      this.get("/orders/:id", (schema, request) => {
        const id = request.params.id;
        return schema.orders.find(id);
      });
    },
  });
}