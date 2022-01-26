var CryptoJS = require("crypto-js");

exports.seed = function(knex) {
  return knex('users').del()
    .then(function () {
      return knex("users").insert([
        {
          id: 1,
          name: "Allie Grater",
          email: CryptoJS.AES.encrypt("allie@hacktitude.io", "HACKTITUDE_SecretKey").toString(),
          password:
            "$2b$10$Ix6ceI.HcuGal9MqUE6Whu4UNF.OZWo0Ix3imeTP5UhhCeeZbDf5K",
          country_currency: "INR",
        },
        {
          id: 3,
          name: "Rose Bush",
          email: CryptoJS.AES.encrypt("rose@hacktitude.io", "HACKTITUDE_SecretKey").toString(),
          password:
            "$2b$10$uQURixWfKPXw4pDRR3qYyuriwSPhDg7bxY1s1OaW1YLOGZDO8kl3G",
          country_currency: "NZD",
        },
        {
          id: 4,
          name: "Art Decco",
          email: CryptoJS.AES.encrypt("art@hacktitude.io", "HACKTITUDE_SecretKey").toString(),
          password:
            "$2b$10$c7.LcW7fBNm4a.m2LoOd9OmjVujAN/Be24Sl6kfvEjRhLtH.9XRs.",
          country_currency: "MYR",
        },
        {
          id: 5,
          name: "Mary Krismass",
          email: CryptoJS.AES.encrypt("mary@hacktitude.io", "HACKTITUDE_SecretKey").toString(),
          password:
            "$2b$10$rasDTA8GXxETrxPpaOz3Quplu/CguxF71/.gxTQ5vK3jNnYJjOEuK",
          country_currency: "LKR",
        },
        {
          id: 8,
          name: "Abby Normal",
          email: CryptoJS.AES.encrypt("abby@hacktitude.io", "HACKTITUDE_SecretKey").toString(),
          password:
            "$2b$10$rasDTA8GXxETrxPpaOz3Quplu/CguxF71/.gxTQ5vK3jNnYJjOEuK",
          country_currency: "SGD",
        },
      ]);
    });
};

// This is the users table which has details about the registered users

// id -> PRIMARY KEY
// name -> User's name
// email -> User's email
// password -> User's hashed password
// country_currency -> The currency code of the country where the user belongs to
