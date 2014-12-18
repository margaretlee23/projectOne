var express 	 = require('express'),
	ejs 		 = require('ejs'),
	app			 = express(),
	path		 = require('path'),
	bodyParser 	 = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session    	 = require('express-session'),
	db			 = require('./db.js'),
	methodOverride = require('method-override');


var LocalStrategy = require('passport-local').Strategy
    passport  = require('passport');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(methodOverride('_method'));

var localStrategy = new LocalStrategy({
  usernameField: 'email'

  },
  function(email, password, done) {
  	console.log('log')
    db.query('SELECT * FROM users WHERE email = $1', [email], function(err, dbRes) {
     	var user = dbRes.rows[0];

    	console.log(user);


      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Unknown user'}); }
      if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
      return done(null, user);
    })
  }
);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	db.query('SELECT * FROM users WHERE id = $1', [id], function(err, dbRes) {
		if (!err) {
			done(err, dbRes.rows[0]);
		}
	});
});

passport.use(localStrategy);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
	var user = req.user
	res.render('index');
});

app.post('/search', function(req, res) {
	db.query('SELECT * FROM users u JOIN category c ON c.user_id = u.id WHERE c.category = $1 and u.city = $2', [req.body.category, req.body.city], function(err, dbRes) {
		if (!err) {
				console.log(dbRes.rows);
				res.render('result', { users: dbRes.rows });
			}
		console.log(err);
	});
});

app.get('/search', function(req,res) {
	res.render('profiles/show');
})


app.get('/users/new', function(req, res) {
	res.render('users/new');
});


app.post('/users', function(req, res) {
	db.query('INSERT INTO users (name, email, password, address, city, category) VALUES ($1, $2, $3, $4, $5, $6)', [req.body.name, req.body.email, req.body.password, req.body.address, req.body.city, req.body.category], function(err, dbRes) {
			if (!err) {
				res.redirect('/sessions/new');
			}
	});
});




app.get('/sessions/new', function(req, res) {
	res.render('sessions/new');
});

app.post('/sessions', passport.authenticate('local', 
  {failureRedirect: '/sessions/new'}), function(req, res) {
    id = req.user.id
    res.redirect('/profiles/' + id);
});

app.delete('/sessions', function(req, res) {
	req.logout();
	res.redirect('/');
});

// app.get('/profiles', function(req, res) {
// 	db.query('SELECT * FROM users', function(err, dbRes) {
// 		res.render('profiles/index', { users: dbRes.rows });
// 	});
// });

app.get('/profiles/:id', function(req, res) {
	db.query('SELECT * FROM users WHERE id = $1', [req.params.id], function(err, dbRes) {
		if (!err) {
			res.render('profiles/show', { user: dbRes.rows[0],
			                              authUser: req.user });
		} 
	});
});

  // confirm that :id is the same as req.user.id
  // next();
  // else redirect to login

app.get('/profiles/:id/edit', function(req, res) {
	db.query('SELECT * FROM users WHERE id = $1', [req.params.id], function(err, dbRes) {
		if (!err && (req.params.id == req.user.id)) {
			res.render('profiles/edit', { user: dbRes.rows[0],
			                              authUser: req.user });
		} else {
			res.redirect('/sessions/new');
		}
	});
});

app.patch('/profiles/:id', function(req, res) {
	db.query('UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4', [req.body.name, req.body.email, req.body.password, req.params.id], function(err, dbRes) {
		if (!err) {
			res.redirect('/profiles/' + req.params.id);
		}
	});
});


// app.delete('/profiles/:id', function(req, res) {
// 	db.query('DELETE FROM users WHERE id = $1', [req.params.id], function(err, dbRes) {
// 		if (!err) {
// 			res.redirect('/profiles');
// 		}
// 	})
// });


app.listen(8080, function() {
  console.log('Server up!');
});