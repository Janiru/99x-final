const express = require('express');
const router = express.Router();
const homeService = require('../services/homeService');
const courseService = require('../services/courseService');
const userService = require('../services/userService');

router.get('/signin', async (req, res) => {
  res.render('signin.ejs', { message: '' });
});

router.post('/signin', async (req, res) => {
  homeService
    .signInUser(req.body.email, req.body.password)
    .then((user) => {
      req.session.userId = user.id;
      res.redirect('/user/home');
    })
    .catch((error) => {
      console.log(error);
      res.render('signin.ejs', { message: error });
    });
});

router.get('/signup', async (req, res) => {
  res.render('signup.ejs', { message: '' });
});

router.post('/signup', async (req, res) => {
  userService
    .signUpUser(
      req.body.name,
      req.body.email,
      req.body.passwordOne,
      req.body.passwordTwo
    )
    .then((data) => {
      res.redirect('/');
    })
    .catch((data) => {
      res.render('signup.ejs', { message: data.error });
    });
});

router.get('/home', async (req, res) => {
  const userId = req.session.userId;
  if (userId == null) {
    res.redirect('/');
  } else {
    homeService
      .getUserSpecificDetailsWithId(userId)
      .then((data) => {
        let total = 0;
        if (data.userCourses.length > 0) {
          data.userCourses.forEach((course) => {
            total += course.score;
          });
        }
        courseService
          .sortedCourses('sort', 'popularity')
          .then((sortedCourses) => {
            res.render('home.ejs', {
              userName: data.user.name,
              userId: data.user.id,
              courses: data.userCourses,
              recentCourses:
                sortedCourses.length > 5
                  ? sortedCourses.slice(0, 5)
                  : sortedCourses,
              level:
                data.userCourses.length <= 2
                  ? 'Novice'
                  : total > 90
                  ? 'Expert'
                  : data.userCourses.length > 2 ||
                    data.userCourses.filter((course) => course.score > 0)
                      .length > 0
                  ? 'Beginner'
                  : '||', //TODO
            });
          });
      })
      .catch((error) => {
        res.render('error.ejs', { message: error });
      });
  }
});

router.get('/flag', async (req, res) => {
  const userId = req.session.userId;

  userService
    .userFlag(userId)
    .then((data) => {
      res.json({ flag: data });
    })
    .catch((error) => {
      res.render('error.ejs', { message: error });
    });
});

router.post('/signout', async (req, res) => {
  req.session.userId = null;
  res.redirect('/');
});

module.exports = router;
