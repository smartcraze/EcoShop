import { v4 as uuid } from "uuid";
import { formatDate } from "../utils/authUtils";
/**
 * User Database can be added here.
 * You can add default users of your wish with different attributes
 * Every user will have cart (Quantity of all Products in Cart is set to 1 by default), wishList by default
 * */

export const users = [
  {
    _id: uuid(),
    firstName: "Rashmi",
    lastName: "Dubey",
    email: "rashmidubey@gmail.com",
    password: "rashmidubey",
    createdAt: formatDate(),
    updatedAt: formatDate(),
  },
  {
    _id: uuid(),
    firstName: "John",
    lastName: "Doe",
    email: "JohnDoe@gmail.com",
    password: "JohnDoe",
    createdAt: formatDate(),
    updatedAt: formatDate(),
  },
];
