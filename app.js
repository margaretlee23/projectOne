var express 	 = require('express'),
	ejs 		 = require('ejs'),
	app			 = express(),
	path		 = require('path'),
	bodyParser 	 = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session    	 = require('express-session');
	db			 = require('./db.js'),
	methodOverride = require('method-override');


var passport  = require('passport'),
LocalStrategy = require('passport-local').Strategy;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// app.use('/images', express.static(__dirname + 'images'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

var localStrategy = new LocalStrategy({usernameField: 'email'},
  function(email, password, done) {
  
  	db.query('SELECT * FROM users WHERE email = $1', [email], function(err, dbRes) {
  		var user = dbRes.rows[0];
  		// if (err) { 
  		// 	return done(err); 
  		// }
  		// if (!user) { return done(null, false, { message: 'Unknown user ' + email }); }
  		// if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
  		return done(null, user);
  	});
  }
)


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(localStrategy);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
	var user = req.user
	res.render('index');
});

app.get('/users/new', function(req, res) {
	res.render('users/new');
});

app.post('/users', function(req, res) {
	db.query('INSERT INTO users (name, email, password, address, city, phone, category) VALUES ($1, $2, $3, $4, $5, $6, $7)', [req.body.name, req.body.email, req.body.password, req.body.address, req.body.city, req.body.phone, req.body.category], function(err, dbRes) {
			if (!err) {
				res.redirect('/sessions/new');
			}
	});
});

app.get('/sessions/new', function(req, res) {
	res.render('sessions/new');
});


app.post('/sessions', passport.authenticate('local', 
  {failureRedirect: '/'}), function(req, res) {
    res.redirect('/profiles/:id', { user: dbRes.rows[0] });
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
			res.render('profiles/show', { user: dbRes.rows[0] });
		}
	});
});

// app.get('/posts/:id/edit', function(req, res) {
// 	db.query('SELECT * FROM posts WHERE id = $1', [req.params.id], function(err, dbRes) {
// 		if (!err) {
// 			res.render('posts/edit', { post: dbRes.rows[0] });
// 		}
// 	});
// });

// app.patch('/posts/:id', function(req, res) {
// 	db.query('UPDATE posts SET title = $1, body = $2 WHERE id = $3', [req.body.title, req.body.body, req.params.id], function(err, dbRes) {
// 		if (!err) {
// 			res.redirect('/posts/' + req.params.id);
// 		}
// 	});
// });

app.delete('/profiles/:id', function(req, res) {
	db.query('DELETE FROM posts WHERE id = $1', [req.params.id], function(err, dbRes) {
		if (!err) {
			res.redirect('/profiles');
		}
	})
});



app.listen(8080, function() {
  console.log('Server up!');
});