//moduler 
var mysql = require('mysql2');
var moment = require('moment');
//---Local storage
var LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./scratch');

var db = require("../db.js")

console.log('&&&& BD: '+db.mysqlCon);

var galleryImages = "[" +
		"{\"num\":0, \"txt\":\"Vitrine SHAA'M Beauty et entrée du salon\"}," +
		"{\"num\":1, \"txt\":\"Entrée du salon de coiffure\"}," +
		"{\"num\":2, \"txt\":\"Salle principale du salon de coiffure\"}," +
		"{\"num\":3, \"txt\":\"Salle d'onglerie du salon de coiffure\"}," +
		"{\"num\":4, \"txt\":\"Poste de pédicure du salon de coiffure\"}," +
		"{\"num\":5, \"txt\":\"Poste d'accueil du salon de coiffure\"}," +
		"{\"num\":6, \"txt\":\"Coin boutique du salon de coiffure\"}," +
		"{\"num\":7, \"txt\":\"Postes de travail du salon de coiffure\"}," +
		"{\"num\":8, \"txt\":\"Poste de pédicure du salon de coiffure\"}," +
		"{\"num\":9, \"txt\":\"Coin boutique du salon de coiffure\"}," +
		"{\"num\":10, \"txt\":\"Sièges d'attente et coin boutique du salon de coiffure\"}," +
		"{\"num\":11, \"txt\":\"Equipement de coiffure d'un poste de travail du salon de coiffure\"}," +
		"{\"num\":12, \"txt\":\"Postes de travail vus de dos\"}," +
		"{\"num\":13, \"txt\":\"Postes de travail du salon de coiffure\"}," +
		"{\"num\":14, \"txt\":\"Salle principale vue du fond du salon\"}," +
		"{\"num\":15, \"txt\":\"Salle d'onglerie du salon de coiffure\"}," +
		"{\"num\":16, \"txt\":\"Coiffures afro\"}" +
		"]";
var galleryImgesObj = JSON.parse(galleryImages);

for (let i in galleryImgesObj) {
	console.log("## Num="+galleryImgesObj[i].num+", Txt="+galleryImgesObj[i].txt);
}

/*=======================
REST controller functions
==========================*/
//authentication check
/*
exports.authentication = (req, res, next) => {

   if (req.session.mail != undefined) {
      next();
   }
   else {
      res.render('user/home', { user: "" });
   }
}
*/

/*=======================
show the home page
==========================*/
exports.getHome = (req, res, next) => {
	console.log('@@ HOME/Body: '+JSON.stringify(req.body));

	console.log('@@ HOME/Session: '+JSON.stringify(req.session));
	if (req.session.connectedUser){
		res.render('home', {itemACC:1, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, csrf: 'CSRF token goes here' });
	}
	else {
		req.session.destroy();

		res.render('home', {itemACC:1, csrf: 'CSRF token goes here' });
	}
}

/*=======================
User to log in
==========================*/
exports.getLogin = (req, res, next) => {
   res.render('login', {itemCON:1, selectedmenu:'CON'});
}

//========= post page of login
exports.postLogin = (req, res, next) => {

console.log('@@ LOGIN/Body: '+JSON.stringify(req.body));

   queryStr = "SELECT * " +
      "FROM  customer " +
      "WHERE phonenumber = " + mysql.escape(req.body.phone) +
      " AND password = " + mysql.escape(req.body.pass);

		console.log("## QueryString="+queryStr);

   db.mysqlCon.query(queryStr, (err, result) => {
      if (err) {
		console.log("*** Err="+JSON.stringify(err)+" ***");
		res.render('createaccount', {selectedmenu:'CRC', err:['Un compte vous est nécessaire']});
	  }
      else {
		console.log("## Result="+result+" ###");
         if (result.length) {
			console.log('@@ Body: '+JSON.stringify(result[0]));
            //req.session.phone = result[0].phonenumber;
			
			req.session.connectedUser = {
				name: result[0].username,
				phone: result[0].phonenumber,
			}	
			
            //res.render('booking', {itemRES:1, selectedmenu:'RES', user: {name: result[0].username, phonenumber: result[0].phonenumber}});
			res.redirect('/mybookings');
         }
         else {
            res.render('login', {itemCON:1, selectedmenu:'CON', msg: [], err: ["Votre téléphone n'est pas enregistré chez nous", "Veuillez créer un compte si ce n'est pas déjà fait."] });
         }

      }
   })

}

/*=======================
User to register
==========================*/
exports.getCreateAccount = (req, res, next) => {
	req.session.destroy();

	res.render('createaccount', {itemCRC:1, msg: "Inscrivez-vous gratuitement ici pour être en mesure de prendre des rendez-vous à SHAA'M Beauty" })
}

//========== get data from user for create account
exports.postCreateAccount = (req, res, next) => {
	console.log("@@ MP1="+req.body.pwd+", MP2="+req.body.pwdconf+", username="+req.body.username+", phonenumber="+req.body.phonenumber);
	
   if (req.body.username.length < 4) { // Identifiant invalide 
      return res.render("createaccount", {itemCRC:1, msg: [], err: ["Nom d-utilisatrice / d'utilisateur invalide. Au moins 4 caractères sont nécessaires"] })
   }

   if (req.body.pwd != req.body.pwdconf) { // if password doesn't match 
      return res.render("createaccount", {itemCRC:1, msg: [], err: ["Les 2 mots de passe ne sont pas identiques"] })
   }
   
   // if (! validatePhone(req.body.phonenumber)) {
      // return res.render("createaccount", {itemCRC:1, user: "", msg: [], err: ["Le format du numéro de téléphone indiqué n'est pas valide"] })
   // }
   
   getUsersPhones((err, usersPhones)=> {
		if (err) {
			console.log("*** Erreur: "+err+" ***");
		}
		else {
			console.log("## [1] !!!!!!!!!! createAccount/Users="+JSON.stringify(usersPhones));

			var found = false;
			
			for (let i in usersPhones) {
				//console.log("Phone="+usersPhones[i].phone);
				if (req.body.userphone === usersPhones[i].phone) {
					found = true;
					break
				}
			}
			
			if (found) {
				res.render('createaccount', {itemCRC:1, err: "Le numéro de téléphone indiqué ("+req.body.phonenumber+") est déjà utilisé. Si nécessaire utilisez le bouton 'mot de passe oublié'"});
			}
			else {
			   var queryStr = "INSERT INTO customer (phonenumber, username, password, profile, creationdate)" +
				  " VALUES ( '" + req.body.phonenumber + "' ,'" + req.body.username + "','" + req.body.pwd + "', 0, now())";

			   db.mysqlCon.query(queryStr, (err, result) => {
				  if (err) {
					  console.log("*** Create account.Err="+JSON.stringify(err)+" ***");
					  if (err.sqlMessage.includes("Duplicate entry")) {
						   res.render('createaccount', {itemCRC:1, selectedmenu:'CRC', err: "Le numéro "+req.body.phonenumber+" a été déjà enregistré. Veuillez utiliser un autre numéro"});
					  }
					  else {
						   res.render('createaccount', {itemCRC:1, selectedmenu:'CRC', err: "Erreur d'enregistrement avec le numùéro "+req.body.phonenumber});
					  }
				  }
				  else {
					 res.render('home', {itemACC:1, msg: ["Vous êtes enregistré(e) avec succès sur SHAA'M Beauty\nVous avez maintenant la possibilité de prendre des rendez-vous pour bénéficier de nos prestations. A très bientôt"]}); //show login page
				  }
			   })
			}
		}
	});
 }

//=========== Show Booking page
exports.getBooking = (req, res, next) => {
	if (req.session.connectedUser){
		res.render('booking', {itemRES:1, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, csrf: 'CSRF token goes here' });
	}
	else{
		res.render('login', {itemCON:1, err: "Veuillez vous connecter pour pouvoir prendre un rendez-vous ou gérer vos rendez-vous" })
	}
}

//========== get data from user for booking
exports.postBooking = (req, res, next) => {
	console.log("@@ BOOKING/Body="+JSON.stringify(req.body));
	console.log("@@ BOOKING: Username="+req.body.username+", Phone="+req.body.userphone+", bookingdate="+req.body.bookingdate+", bookingtime="+req.body.bookingtime);
	
	if (req.session.connectedUser) { //---Non connecté(e)
		var appointmentDate = moment(req.body.bookingdate+" "+req.body.bookingtime, 'DD/MMM/YYYY HH:mm:ss').toDate();
		
		console.log("@@ BOOKING/appointmentDate="+appointmentDate);
		
		// var queryStr = "INSERT INTO booking (phonenumber, appointmentdate, creationdate)" +
		  // " VALUES ( '" + req.body.userphone + "' ," + CONVERT(datetime, req.body.bookingdate+" "+req.body.bookingtime) + ", now())";

		var queryStr = "INSERT INTO booking (phonenumber, appointmentdate, creationdate) VALUES" +
		  " ('"+req.body.userphone+"' ,STR_TO_DATE('"+req.body.bookingdate+" "+req.body.bookingtime+"', '%d/%m/%Y %H:%i:%s'), now())";

		console.log("@@ BOOKING/queryStr="+queryStr);

		db.mysqlCon.query(queryStr, (err, result) => {
			if (err) {
				console.log("*** Booking.Err="+JSON.stringify(err)+" ***");
				res.render('booking', {itemRES:1, selectedmenu:'RES', user: {name: req.body.username, phonenumber:req.body.userphone}, err:"Echec d'enregistrement de votre réservation" });
			}
			else {
				res.redirect('/mybookings');
			}
	   })
	}
	else {
		req.session.destroy();

		res.render('home', {itemACC:1, msg: "Vous devez vous connecter pour prendre un rendez-vous ou gérer vos rendez-vous"})
	}
   
}

//========== get user bookings
exports.getMyBookings = (req, res, next) => {
		console.log("@@ ------------------- MYBOOKINGS/User="+JSON.stringify(req.session.connectedUser));
	if (req.session.connectedUser) {
		console.log("@@ MYBOOKINGS/User phone="+req.session.connectedUser.phone);
			
		var queryStr = "SELECT bookingcount, phonenumber, DATE_FORMAT(appointmentdate,'%d/%m/%YT%H:%i:%s') AS appointmentdate FROM booking WHERE phonenumber = '"+req.session.connectedUser.phone+"'";
		
		console.log("@@ MYBOOKINGS/queryStr="+queryStr);

		db.mysqlCon.query(queryStr, (err, result) => {
			if (err) {
				console.log("*** Booking.Err="+JSON.stringify(err)+" ***");
				res.render('mybookings', {itemMRV:1, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, msg:"Vous n'avez aucun rendez-vous pour l'instant" });
			}
			else {
				console.log("@@ MYBOOKINGS/ListRDV="+JSON.stringify(result));
			
				var mesRdv = "[";
				for (let i in result) {
					if (mesRdv != "[") {
						mesRdv += ",";
					}
					let dtRdvStr = JSON.stringify(result[i].appointmentdate)
					console.log(i+": Tél="+result[i].phonenumber+", Date="+dtRdvStr);
					
					mesRdv += "{\"phone\":\""+req.session.connectedUser.phone+"\",\"id\":"+result[i].bookingcount+",\"date\":"+dtRdvStr.split("T")[0]+"\",";
					mesRdv += "\"time\":\""+dtRdvStr.split("T")[1]+"}";
				}
				mesRdv += "]";

				console.log("@========================== RESULT: "+mesRdv+"\n");
				var mesRdvObj = JSON.parse(mesRdv);
				
				if (mesRdvObj.length < 1) 
					res.render('mybookings', {itemMRV:1, myappointments:mesRdvObj, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, msg:"Pour l'instant vous n'avez aucun rendez-vous"});
				else
					res.render('mybookings', {itemMRV:1, myappointments:mesRdvObj, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
				
		  }
	   })
   	}
	else {
		req.session.destroy();

		res.render('home', {itemACC:1, msg: "Vous devez vous connecter pour prendre un rendez-vous ou gérer vos rendez-vous"})
	}
}

//========== get Logout
exports.getLogout = (req, res, next) => {
	
	req.session.destroy();
	
	console.log('@@ LOGOUT/Body: '+JSON.stringify(req.body));
	console.log('@@ LOGOUT/Session: '+JSON.stringify(req.session));

	res.render('home', {itemACC:1, csrf: 'CSRF token goes here' });
}

//========== Update appointmentDate
exports.updateBooking = (req, res, next) => {
	console.log("@@ updateBooking: BookingId="+req.body.bookingid+", Phone="+req.body.userphone+", bookingdate="+req.body.bookingdate+", bookingtime="+req.body.bookingtime);
	
	if (req.session.connectedUser) { //---Non connecté(e)
	
		getBookings(req.body.userphone, (err, userBookings)=> {
			if (err) {
				console.log("*** Erreur: "+err+" ***");
			}
			else {
				//console.log("## [1] >>>>>>>>>>> updateBooking/UserBooking="+JSON.stringify(userBookings));

				var found = false;
				
				for (let i in userBookings) {
					console.log("Phone="+userBookings[i].phone+"ID="+userBookings[i].id+": Date="+userBookings[i].date+", Time="+userBookings[i].time);
					if ((req.body.bookingdate === userBookings[i].date) && (req.body.bookingtime === userBookings[i].time) ) {
						found = true;
						break
					}
				}
				
				if (found) {
					res.render('mybookings', {itemMRV:1, myappointments:userBookings, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, err:"Vous avez déjà un rendez-vous pour cette date (le "+req.body.bookingdate+" à "+req.body.bookingtime+")"});
				}
				else {
					var queryStr = "UPDATE booking SET appointmentdate=STR_TO_DATE('"+req.body.bookingdate+" "+req.body.bookingtime+"', '%d/%m/%Y %H:%i:%s') WHERE bookingcount = "+req.body.bookingid;
		
					console.log("@@ updateBooking/QueryStr="+queryStr);
		
					db.mysqlCon.query(queryStr, (err, result) => {
					if (err) {
						console.log("*** updateBooking.Err="+JSON.stringify(err)+" ***");
						res.render('mybookings', {itemMRV:1, myappointments:userBookings, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, err:"Erreur d'enregistrement de vos modifications de votre rendez-vous du "+req.body.bookingdate+" à "+req.body.bookingtime});
					}
					else {
						console.log("@@ updateBooking/RESULT="+JSON.stringify(result));
						
						res.redirect('/mybookings');
						//res.render('mybookings', {itemMRV:1, myappointments:userBookings, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}, msg:"La modification de votre rendez-vous a été bien enregistrée"});
					  }
				   })
				}
			}
		});
	}
	else {
		req.session.destroy();

		res.render('home', {itemACC:1, msg: "Vous devez vous connecter pour prendre un rendez-vous ou gérer vos rendez-vous"})
	}
}


//======= delete booking request
exports.deleteBooking =(req,res,next)=>{
	console.log('@@ deleteBooking: PRM.Id='+req.params.id);
	
	var queryStr = "DELETE FROM booking WHERE bookingcount="+req.params.id;

	console.log('@@ deleteBooking/Request: queryStr='+queryStr);

	db.mysqlCon.query(queryStr, (err, result) => {
	if (err) {
		console.log("*** updateBooking.Err="+JSON.stringify(err)+" ***");
	}
	else {
		console.log("@@ updateBooking/RESULT="+JSON.stringify(result[0]));
      }
   })
   
	res.redirect('/mybookings');

}

//======= Show salon gallery
exports.showGallery =(req,res,next)=>{
	console.log('@@ showGallery: PRM.ImgNum=0');
	
	console.log('@@ showGallery: Session='+JSON.stringify(req.session));
   
	if (req.session.connectedUser) {
		if (galleryImgesObj.length > 1)
			res.render('showGallery', {itemGAL:1, moreImg:1, imgnum:0, imgtxt: galleryImgesObj[0].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
		else
			res.render('showGallery', {itemGAL:1, imgnum:0, imgtxt: galleryImgesObj[0].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
	}
	else {
		req.session.destroy();

		if (galleryImgesObj.length > 1)
			res.render('showGallery', {itemGAL:1, moreImg:1, imgnum:0, imgtxt: galleryImgesObj[0].txt});
		else
			res.render('showGallery', {itemGAL:1, imgnum:0, imgtxt: galleryImgesObj[0].txt});
	}
}

//--- Show gallery next image
exports.showGalleryNext =(req,res,next)=>{
	console.log('@@ showGalleryNext: PRM.ImgNum='+req.params.imgnum);
	console.log('@@ showGallery: ImgNum-1='+req.params.imgnum);
	console.log('## showGallery: image number='+galleryImgesObj.length);
   
	var imgNum = parseInt(req.params.imgnum) + 1;
	// if (imgNum > MAXINDEX_GALLERY_IMAGES)
		// imgNum = MAXINDEX_GALLERY_IMAGES;

	if (imgNum > (galleryImgesObj.length-1))
		imgNum = (galleryImgesObj.length-1);

	console.log('@@ showGallery: ImgNum-2='+imgNum);
	
	if (req.session.connectedUser) {
		if (imgNum < (galleryImgesObj.length-1))
			res.render('showGallery', {itemGAL:1, extImg:1, moreImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
		else
			res.render('showGallery', {itemGAL:1, extImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
	}
	else {
		req.session.destroy();

		if (imgNum < (galleryImgesObj.length-1))
			res.render('showGallery', {itemGAL:1, extImg:1, moreImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
		else {
			res.render('showGallery', {itemGAL:1, extImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
		}
	}
}

//--- Show gallery previous image
exports.showGalleryPrev =(req,res,next)=>{
	console.log('@@ showGalleryPrev: PRM.ImgNum='+req.params.imgnum);
	
	console.log('@@ showGallery: ImgNum-1='+req.params.imgnum);
   
	var imgNum = parseInt(req.params.imgnum) - 1;
	if (imgNum < 0)
		imgNum = 0;

	console.log('@@ showGallery: ImgNum-2='+imgNum);
	
	if (req.session.connectedUser) {
		if (imgNum > 0) {
			if (galleryImgesObj.length > 1)
				res.render('showGallery', {itemGAL:1, extImg:1, moreImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
			else
				res.render('showGallery', {itemGAL:1, extImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
		}
		else {
			if (galleryImgesObj.length > 1)
				res.render('showGallery', {itemGAL:1, moreImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
			else
				res.render('showGallery', {itemGAL:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt, user: {name: req.session.connectedUser.name, phonenumber: req.session.connectedUser.phone}});
		}
	}
	else {
		req.session.destroy();
		if (imgNum > 0) {
			if (galleryImgesObj.length > 1)
				res.render('showGallery', {itemGAL:1, moreImg:1, extImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
			else
				res.render('showGallery', {itemGAL:1, extImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
		}
		else {
			if (galleryImgesObj.length > 1)
				res.render('showGallery', {itemGAL:1, moreImg:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
			else
				res.render('showGallery', {itemGAL:1, imgnum: imgNum, imgtxt: galleryImgesObj[imgNum].txt});
		}
	}
}
/*===============
Helper functions
=================*/
//=== Get a users bookings
function getBookings(userPhone, callback) {
	var queryStr = "SELECT bookingcount, phonenumber, DATE_FORMAT(appointmentdate,'%d/%m/%YT%H:%i:%s') AS appointmentdate FROM booking WHERE phonenumber = '"+userPhone+"'";
	
	console.log("## getBooking/queryStr="+queryStr);

	var mesRdv = "";

	db.mysqlCon.query(queryStr, (err, result) => {
		if (err) {
			console.log("*** Booking.Err="+JSON.stringify(err)+" ***");
            throw err;
		}
		else {
			mesRdv = "[";
			for (let i in result) {
				if (mesRdv != "[") {
					mesRdv += ",";
				}
				let dtRdvStr = JSON.stringify(result[i].appointmentdate)
				
				mesRdv += "{\"phone\":\""+userPhone+"\",\"id\":"+result[i].bookingcount+",\"date\":"+dtRdvStr.split("T")[0]+"\",";
				mesRdv += "\"time\":\""+dtRdvStr.split("T")[1]+"}";
			}
			mesRdv += "]";

	console.log("## &&&&&&&&&&&&&&&&&&&& updateBooking/UserBooking="+mesRdv);
			//return JSON.parse(mesRdv);
			callback(null, JSON.parse(mesRdv));
			
		}
		
	})

}

//=== Get users phones
function getUsersPhones(callback) {
	var queryStr = "SELECT phonenumber AS userphone FROM customer";
	
	console.log("## getUsersPhones/queryStr="+queryStr);

	var usersPhones = "";

	db.mysqlCon.query(queryStr, (err, result) => {
		if (err) {
			console.log("*** getUsersPhones.Err="+JSON.stringify(err)+" ***");
            throw err;
		}
		else {
			usersPhones = "[";
			for (let i in result) {
				if (usersPhones != "[") {
					usersPhones += ",";
				}
				usersPhones += "{\"phone\":\""+result[i]+"\"}";
			}
			usersPhones += "]";

	console.log("## &&&&&&&&&&&&&&&&&&&& getUsersPhones="+usersPhones);
			//return JSON.parse(mesRdv);
			callback(null, JSON.parse(usersPhones));
			
		}
		
	})

}

function validateEmail(email) { //Validates the email address
    var emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) { //Validates the phone number
    var phoneRegex = "^[(\+|00)]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$"; // Change this regex based on requirement
	
    return phoneRegex.test(phone);
}



