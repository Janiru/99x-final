const fetch = require('node-fetch');

let _db;

function init(db) {
  _db = db;
}

const knex_db = require('../db/db-config');

function getRecentCourses(count) {
  const sql = `SELECT * from courses ORDER BY id DESC LIMIT ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [count])
      .then((courses) => {
        resolve(courses);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getAllCourses(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, title, level, userCourses.score, userCourses.uid as user FROM courses 
      LEFT JOIN userCourses ON courses.id = userCourses.cid 
    `;
    knex_db
      .raw(sql)
      .then((courses) => {
        const result = [];
        courses.forEach((course) => {
          let obj = course;
          if (result.find((item) => item.id == course.id)) {
            const index = result.findIndex((item) => item.id == course.id);
            if (course.user == userId) {
              course.status = course.score >= 0 ? 'Completed' : 'Enrolled';
              result[index] = course;
            }
          } else {
            if (course.user == userId) {
              course.status = course.score >= 0 ? 'Completed' : 'Enrolled';
            }
            result.push(course);
          }
        });
        console.log(result);
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getReviews(courseId) {
  const sql = `SELECT review, users.name, cid, uid from userCourses
    INNER JOIN users on userCourses.uid = users.id
  `;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql)
      .then((rows) => {
        const result = rows.filter(
          (row) => row.cid == parseInt(courseId) && row.review != null
        );
        resolve(result);
      })
      .catch(reject);
  });
}

function getAverageMarks(courseId) {
  const sql = `SELECT * FROM userCourses WHERE cid = ? AND score <> ?`;
  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [courseId, -1])
      .then((result) => {
        if (result.length == 0) resolve(0);
        let total = 0;
        result.forEach((item) => (total += item.score));
        resolve(Math.round(total / result.length));
      })
      .catch(reject);
  });
}

function getUserCourses(userID) {
  const sql = `SELECT * from userCourses WHERE uid = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [userID])
      .then((courses) => {
        const injectedString = courses.map((c) => `'${c.cid}'`).join(', ');
        const sql2 = `SELECT courses.id, courses.title, userCourses.score FROM courses INNER JOIN userCourses WHERE id IN (${injectedString}) AND courses.id == userCourses.cid AND userCourses.uid = ?`;

        knex_db
          .raw(sql2, [userID])
          .then((courses) => {
            resolve(courses);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getSearchedCourses(userID, searchVal) {
  return new Promise((resolve, reject) => {
    const sql2 = `SELECT title, description, level FROM courses WHERE title LIKE '%${searchVal}%' OR description LIKE '%${searchVal}%'`;

    knex_db
      .raw(sql2)
      .then((courses) => {
        resolve(courses);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getEnrollments(courseId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM userCourses WHERE cid = ?
    `;
    knex_db
      .raw(sql, [courseId])
      .then((result) => {
        resolve(result.length);
      })
      .catch(reject);
  });
}

function getSortedCourses(action, value) {
  let sql = `SELECT id, title, level FROM courses`;

  return new Promise((resolve, reject) => {
    if (action == 'sort') {
      if (value == 'name') {
        sql = `SELECT id, title, level FROM courses ORDER BY title`;
      } else if (value == 'popularity') {
        sql = `

        SELECT id, title, level, description, price, count(userCourses.cid) as counts FROM courses
        LEFT JOIN userCourses on courses.id = userCourses.cid
        GROUP BY id
        ORDER BY counts DESC, title
        `;
      }

      knex_db
        .raw(sql)
        .then((courses) => {
          console.log(courses);
          const result = [];
          courses.forEach((course) => {
            if (!result.find((res) => res.id == course.id)) {
              const count = courses.filter(
                (item) => item.id == course.id
              ).length;
              result.push({ ...course, count });
            }
          });

          const sortedArr = result.sort((a, b) =>
            a.count == b.count ? a.tite - b.title : b.count - a.count
          );
          resolve(sortedArr);
        })
        .catch((error) => {
          reject(error);
        });
    } else if (action == 'filter') {
      sql = `SELECT id, title, level FROM courses WHERE level = ? ORDER BY title`;
      knex_db
        .raw(sql, [value])
        .then((courses) => {
          resolve(courses);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      knex_db
        .raw(sql)
        .then((courses) => {
          resolve(courses);
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

function getCourseDetails(userId, courseId) {
  const sql = `SELECT id, title, level, description,duration,enrollments, price FROM courses WHERE id = ?`;
  const sql2 = `SELECT uid FROM userCourses WHERE cid = ? AND uid = ?`;

  return new Promise(async (resolve, reject) => {
    let enrolled = '';
    var registeredCourses = await knex_db.raw(sql2, [courseId, userId]);
    if (registeredCourses.length > 0) {
      enrolled = 'yes';
    } else {
      enrolled = 'no';
    }

    knex_db
      .raw(sql, [courseId])
      .then((courses) => {
        let course = courses[0];
        resolve({ course, enrolled });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function enrollInCourse(userId, courseId) {
  const sql = `INSERT INTO userCourses(cid,uid,score) VALUES(?,?,-1)`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [courseId, userId])
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function unenrollCourse(userId, courseId) {
  const sql = `DELETE FROM userCourses WHERE cid = ? AND uid = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [courseId, userId])
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getCourseContentDetails(courseId) {
  const sql = `SELECT id, title, level, description FROM courses WHERE id = ?`;
  const sql1 = `SELECT description , id FROM chapters WHERE cid = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [courseId])
      .then((course_data) => {
        knex_db
          .raw(sql1, [courseId])
          .then((chapters_data) => {
            let course = course_data[0];
            let chapters = chapters_data;
            resolve({ course, chapters });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function resetEnrolledCourses(userId) {
  const sql = `DELETE FROM userCourses WHERE uid = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [userId])
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getCourseMcq(courseId) {
  const sql1 = `SELECT qid FROM courseQuestions WHERE cid = ?`;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql1, [courseId])
      .then((data) => {
        const injectedString = data.map((c) => `'${c.qid}'`).join(', ');
        const sql2 = `SELECT qid, questions FROM mcqQuestions WHERE qid IN (${injectedString}) `;

        knex_db
          .raw(sql2)
          .then((questions) => {
            const injectedString = data.map((c) => `'${c.qid}'`).join(', ');
            const sql3 = `SELECT qid, answer, aid FROM mcqAnswers WHERE qid IN (${injectedString})`;

            knex_db
              .raw(sql3)
              .then((answers) => {
                resolve({ questions, answers });
              })
              .catch((error) => {
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function postCourseReview(courseId, userId, review) {
  const sql = `UPDATE usercourses
    SET review = ?
    WHERE cid = ? AND uid = ? 
  `;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql, [review, courseId, userId])
      .then(() => {
        resolve();
      })
      .catch(reject);
  });
}

function setCourseScore(courseId, userId, ans1, ans2, ans3) {
  const sql1 = `SELECT qid FROM courseQuestions WHERE cid = ?`;
  const sql3 = `UPDATE userCourses SET score = ? WHERE (cid = ? AND uid = ?)`;
  const sql4 = `SELECT score FROM userCourses WHERE (cid = ? AND uid = ?)`;

  let score = 0;

  return new Promise((resolve, reject) => {
    knex_db
      .raw(sql1, [courseId])
      .then((data) => {
        const injectedString = data.map((q) => `'${q.qid}'`).join(', ');
        const sql2 = `SELECT aid FROM correctAnswers WHERE qid IN (${injectedString})`;

        knex_db
          .raw(sql2)
          .then((data) => {
            if (ans1 == Object.values(data[0])) {
              score = score + 10;
            }
            if (ans2 == Object.values(data[1])) {
              score = score + 10;
            }
            if (ans3 == Object.values(data[2])) {
              score = score + 10;
            }

            knex_db
              .raw(sql3, [score, courseId, userId])
              .then(() => {
                knex_db
                  .raw(sql4, [courseId, userId])
                  .then(() => {
                    resolve(score);
                  })
                  .catch((error) => {
                    reject(error);
                  });
              })
              .catch((error) => {
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  getAllCourses,
  getUserCourses,
  getSearchedCourses,
  getSortedCourses,
  getCourseDetails,
  enrollInCourse,
  unenrollCourse,
  getCourseContentDetails,
  resetEnrolledCourses,
  getCourseMcq,
  setCourseScore,
  getRecentCourses,
  getEnrollments,
  getAverageMarks,
  getReviews,
  postCourseReview,
  init,
};
