var request = require('request');
var fs = require('fs');
var async = require('async');
var linkAddresses = [];
var emails = {};

async.series([
  function loadExistingEmails(done) {
    done();
  },
  function getPageLinks(done) {console.log('start');
    var page = 0;
    var hasError = false;

    async.whilst(
      function() { return !hasError && page < 3; },
      function(cb) {
       
		request('http://www.kijiji.ca/b-apartments-condos/city-of-toronto/page-' + (page++) + '/c37l1700273', function(error, response, body) {
		//request('http://www.kijiji.ca/b-apartments-condos/city-of-toronto/page-' + (page++) + '/c37l1700273', function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var regex = /[a-z="]+\/[a-z\-0-9]+\/[\-a-z0-9]+\/[a-z\-0-9]+\/[a-zA-Z0-9=?"]+/g;
            var words = body.split(" ");

            for (var i = 0; i < words.length; i++) {
              var a = words[i].match(regex);
              // reformat the link address to a standard website address
              if (a != null) {
                for (var j = 0; j < a.length; j++) {
                  a[j] = a[j].replace("href=\"", "");
                  a[j] = a[j].replace("\"", "");
                  linkAddresses.push("http://www.kijiji.ca" + a[j]);
                };
              }
            }
          } else {
            hasError = true;
          };
          cb();
        });
      },
      function _finally(err) {
        done();
      }
    );
  },
  function getEmails(done) {
    // find the email address that match the regular expression in each listing
    async.eachSeries(linkAddresses, function(linkAddress, iterDone) {
      request(linkAddress, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var counter = 0;
          var regex1 = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
          // var words1 = body.split(" ");
          var words1 = body.match(regex1);

          for (var k = 0; words1 && k < words1.length; k++) {

            var b = words1[k];
            if (b != null) {
              // set each unique email as a property of the emails object
              if (!emails[b]) {console.log(b);
                emails[b] = 1;
                //console.log("There are " + emails.number + " email addresses in total");
              };
            };
          };
        };
        iterDone();
      });
    }, function _finally(err) {
      done();
    });
  },
  function saveEmails(done) {
    var output = '';

    for (var email in emails) {
      output += email + '\r\n';
    }

    fs.appendFile("Kijiji Emails.txt", output, function(err) {
      if (err) throw error;
      //console.log("Saved");
      done();
    });
  }
]);
