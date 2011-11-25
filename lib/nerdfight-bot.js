var fs = require('fs'),
    request = require('request'),
    irc = require('irc');

var config = JSON.parse(fs.readFileSync('config.json'));

var client = new irc.Client(
  'irc.freenode.net',
  'nerdfightBot',
  config
);

client.on('error', function () {
  console.dir(arguments);
});

var last;

function nerdFight() {
  request({
    uri: 'http://nodejs-vs-ror.nodejitsu.com/api',
    json: true
  }, function (err, res, body) {
    if (err) {
      throw err;
      // fuck it, it's going to run under forever anyway
    }

    var left = body.ror - body.nodejs;
    console.log('Got a new body, node.js: ' + body.nodejs + ', RoR: ' + body.ror + '.');
    if (!last || (last.ror - last.nodejs) > left) {
      console.log('New body is OK.');
      last = body;

      config.channels.forEach(function (channel) {
        if (left == 0) {
          client.say('OH SHIT, BOTH PROJECTS HAVE ' + body.nodejs + ' FOLLOWERS!');
        }
        else if (left < 0) {
          client.say(channel, 'EPIC WIN! We have ' + (-left) + ' more watchers than Ruby on Rails (node.js has ' + body.nodejs + ' watchers and Ruby on Rails has ' + body.ror + ' watchers)!');
        }
        else {
          client.say(channel, 'Only ' + left + ' watchers left (node.js has ' + body.nodejs + ' watchers and Ruby on Rails has ' + body.ror + ' watchers)!');
        }
      });
    }
    else if ((last.ror - last.nodejs) < left) {
      config.channels.forEach(function (channel) {
        if (left == 0) {
          client.say(channel, 'WTH? We lost our winning margin! Now nodejs and ror are equal. F************K');
        }
        else if (left < 0) {
          client.say(channel, 'Ruby on Rails is trying to regain our position by reducing the difference to ' + (-left) + ' (node.js: ' + body.nodejs + ', ror:' + body.ror + ')');
        }
        else {
          client.say(channel, 'WARNING! We moved back to ' + (left) + ' watchers. (node.js: ' + body.nodejs + ', ror: ' + body.ror + ')');
        }
      });
    }
  });
}
setInterval(nerdFight, 1000 * 60 * 4);
client.on('registered', nerdFight);

function saveConfig() {
  fs.writeFile('config.json', JSON.stringify(config));
}

function makeChannel(c) {
  if (c[0] != '#') {
    return '#' + c;
  }
  return c;
}

client.on('pm', function (from, msg) {
  console.log('Got PM from ' + from + ' saying "' + msg + '"');
  if (config.admins.indexOf(from) != -1) {
    var cmd = msg.split(' ');
    if (cmd[0] == 'join' && cmd[1]) {
      cmd[1] = makeChannel(cmd[1]);
      client.join(cmd[1]);
      config.channels.push(cmd[1]);
      saveConfig();
    }
    else if (cmd[0] == 'part' && cmd[1]) {
      cmd[1] = makeChannel(cmd[1]);

      var is = config.channels.indexOf(cmd[1]);
      if (is != -1) {
        client.part(cmd[1]);
        config.channels.splice(is, 1);
        saveConfig();
      }
    }
    else if (cmd[0] == 'crashYourselfLikeAMothafucka') {
      process.nextTick(function () {
        throw new Error(from + ' crashed me!');
      });
    }
    else {
      client.send('Allowed commands: join, part');
    }
  }
  else {
    client.say(from, 'GTFO!');
  }
});


