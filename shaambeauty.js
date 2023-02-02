const express =  require('express');
const path    =  require('path');
const bodyParser = require('body-parser');
//const session = require('express-session');
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')

const credentials = require('./credentials')

const app = express();

const formidable = require('formidable');

const userControler = require('./controllers/user');

var mysqlDb = require('./db.js');

/*--- Views engine ---*/
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

/*--- Application paths ---*/
app.use(express.static(__dirname + '/public'));

app.use('/ncss', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
//app.use('/ncss', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/njs', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/njs', express.static(path.join(__dirname, 'node_modules/jquery/dist')))
app.use('/njs', express.static(path.join(__dirname, 'node_modules/bootstrap-datetimepicker/src/js')))
app.use('/njs', express.static(path.join(__dirname, 'node_modules/moment/min')))

app.use(require('body-parser')());

app.use(cookieParser(credentials.cookieSecret))
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  cookie: { maxAge: 15 * 60 * 1000 }
}))

app.set('port', process.env.PORT || 3200);

/*--- REST endpoints ---*/
app.get('/', function(req, res) {
	res.redirect('home');
});


// app.get('/home', (req, res) => {
    // res.render('home', {selectedmenu:'ACC', csrf: 'CSRF token goes here' });
// });

app.get('/home', userControler.getHome);


/* app.get('/login', (req, res) => {
   res.render('login', {selectedmenu:'CON',user:null});
}); */

app.get('/login', userControler.getLogin);

// app.post('/login', (req, res) => {
    // res.render('login', {user:null});
// });

//--- Create account -----
app.post('/login', userControler.postLogin);

app.get('/createaccount', userControler.getCreateAccount);

app.post('/createaccount', userControler.postCreateAccount);

//--- Bookingt -----
app.get('/booking', userControler.getBooking);

app.post('/booking', userControler.postBooking);

app.get('/bookingok', userControler.getHome);

app.get('/mybookings', userControler.getMyBookings);

//-- Logout ---
app.get('/logout', userControler.getLogout);

//app.post('/logout', userControler.postLogout);

//--- Manage appointments
//app.get('/updateBooking/:id/:phone/:day/:month/:year/:time', userControler.updateBooking);
app.post('/updateBooking', userControler.updateBooking);

app.get('/deleteBooking/:id', userControler.deleteBooking);

app.get('/showGallery', userControler.showGallery);

app.get('/showGalleryNext/:imgnum', userControler.showGalleryNext);

app.get('/showGalleryPrevious/:imgnum', userControler.showGalleryPrev);

/*
Handlebars.registerHelper('ifNotCond', function(v1, v2, options) {
  if(v1 !== v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
*/

//--- No path matching ---
// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' + 
    app.get('port') + '; press Ctrl-C to terminate.' );
});
