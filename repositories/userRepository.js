const bcrypt = require("bcrypt");
const fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
const { encode,decode } = require('../node_modules/hex-encode-decode')

let _db;

function init(db) {
  _db = db;
}

const knex_db = require("../db/db-config");

function getUserByEmailAndPassword(email, password) {
// check if there is a user excisting with the mail 
sql =  `SELECT email from users`;
knex_db.raw(sql).then((data)=>{
  for(i = 0;i<data.length;i++){ 
    DecryptedEmail = decode(CryptoJS.AES.decrypt(data[i].email, "HACKTITUDE_SecretKey").toString())
    if(email == DecryptedEmail){
      exist = true;
      break;
    }
    else {
      exist= false;
    }    
  }
  console.log(exist)
});

//   const sql = `SELECT id, name, email, password FROM users WHERE email = ?`;

//   return new Promise(async (resolve, reject) => {
//     knex_db
//       .raw(sql, [email])
//       .then((dataa) => {
//         if (bcrypt.compareSync(password, dataa[0].password)) {
//           resolve(dataa[0]);
//         } else {
//           reject("User authentication failed");
//         }
//       })
//       .catch((error) => {
//         reject("User authentication failed");
//       });
//   });
 }
// function getUserByEmailAndPassword(email, password){
//   sql =  `SELECT email, password from users`;
//   knex_db.raw(sql).then((data)=>{
//     for(i = 0;i<data.length;i++){ 
//       DecryptedEmail = decode(CryptoJS.AES.decrypt(data[i].email, "HACKTITUDE_SecretKey").toString())
//       if(email == DecryptedEmail){
//         const sql = `SELECT email, password FROM users WHERE email = ?`;
//         knex_db.raw(sql, email).then((data)=>{
//           if (bcrypt.compareSync(password, data[0].password)) {
//             console.log("login sucsess");
//             resolve(data[0]);            
//           } else {
//             reject("User authentication failed");
//           }
//         });

//       }
//     }
    
//   });
// }
function getUserById(id) {
  const sql = `SELECT id, name, email, password FROM users WHERE id = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [id])
      .then((user) => {
        resolve(user[0]);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function signUpUser(name, email, passwordOne, passwordTwo) {
  const sql1 = `SELECT id, name, email, password FROM users WHERE email = ?`;

  return new Promise(async (resolve, reject) => {
    const data = {};

    if (
      name.length < 1 ||
      email.length < 1 ||
      passwordOne.length < 1 ||
      passwordTwo.length < 1
    ) {
      data.error = "values missing";
      reject(data);
    } else {
      knex_db
        .raw(sql1, [email])
        .then(async (user) => {
          if (!(user[0] == undefined)) {
            data.error = "Already Registered";
            reject(data);
          } else {
            if (passwordOne != passwordTwo) {
              data.error = "Passwords Mismatch";
              reject(data);
            } else {
              const hashPassword = await bcrypt.hash(passwordTwo, 10);
              const hashEmail = CryptoJS.AES.encrypt(email, "HACKTITUDE_SecretKey").toString();
              const sql = `INSERT INTO users(id, name, email, password, country_currency) VALUES(NULL,?,?,?,?)`;
              knex_db
                .raw(sql, [name, hashEmail, hashPassword, "LKR"])
                .then(() => {
                  resolve();
                })
                .catch((error) => {
                  reject(error);
                });
            }
          }
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

function getUserCountryFlag(id) {
  const sql = `SELECT country_currency FROM users WHERE id = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [id])
      .then(async (user) => {
        const url = `https://restcountries.com/v2/currency/${user[0].country_currency}`;

        const response = await fetch(url);
        const data = await response.json();

        resolve(data[0].flag);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  getUserByEmailAndPassword,
  getUserById,
  signUpUser,
  init,
  getUserCountryFlag,
};
