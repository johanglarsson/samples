'use strict';

var express = require('express');
var router = express.Router();
var request=require('request');

router.get('/', findTrailer, function(req, res) { });
module.exports = router;

const imdAPIKey = '8c5e88c814cb15cf1c1e732f09c8bf60';
const serviceTimeout = 10000;

//*********************************** 
// API resource: /trailer operation
// Will return the trailer URL
//***********************************

function findTrailer(req, res, next) {
  
  res.set({'content-type': 'text/plain'});

  validateRequest(req.query.resource)
  	.then(getViaplayContent)
  	.then(getImdbTrailerURL)
  	.then(function(data){
  		
  		return res.send(data);
  	})
  	.catch(function(err){
		return res.status(err.code).send(err.error);
  	})

}

// Validate request to prevent invalid requests.
function validateRequest(resourceURL) {

	return new Promise(function(fullfill, reject) {

	  if (resourceURL) {
			//check the url format
			return fullfill( resourceURL );
		} else {
			return reject(createError(404,'Missing resource query parameter'));
		}
	})
	
}

// GET viaplay content info
function getViaplayContent(resourceURL) {

	return new Promise(function(fullfill, reject) {

		request.get(resourceURL,{ timeout: serviceTimeout },function(err,res,body){
		
			if(err) return reject(crateError(500, err));
			if (res.statusCode === 404 ) return reject(createError(res.statusCode, 'Movie ' + resourceURL + ' not found in Viaplay'));
	  		if(res.statusCode !== 200 ) return reject(crateError(res.statusCode, res.body));

	  		let response = JSON.parse(res.body);
	  		
	  		return fullfill(response._embedded['viaplay:blocks'][0]._embedded['viaplay:product'].content.imdb.id); 

		});	
	});
};

// GET IMDB trailer URL based on a movie id.
function getImdbTrailerURL(movieID ) {
	
	return new Promise(function(fullfill, reject) {

		request.get('https://api.themoviedb.org/3/movie/' + movieID + '/videos?api_key=' + imdAPIKey + '&language=en-US',{ timeout: serviceTimeout },function(err,res,body){
			
			if(err) return reject(crateError(500, err));
			if (res.statusCode === 404 ) return reject(createError(res.statusCode, 'Movie trailer ' + movieID + ' not found in IMDB'));
	  		if(res.statusCode !== 200 ) return reject(crateError(res.statusCode, res.body));
	  		let response = JSON.parse(res.body);
	  		return fullfill('http://www.youtube.com/watch?v=' + response.results[0].key); 

		});
	});
};

function createError(httpCode, message) {
	return {code:httpCode, error: message};
};