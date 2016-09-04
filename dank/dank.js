// Load a word list and return an array of words, split upon the separator character(s).
function initialize(wordsFilePath, separator, callback) {
  $.get(wordsFilePath, function(data) {
      if (callback) {
        callback(data.split(separator));
      }
  });
}

// Returns a list of words from the dictionary array, that contain matching consectutive letters in name.
function dankNames(name, dictionary, isVerbose) {
  var results = [];
  var count = 0;
  var total = dictionary.length;

  name = name.toLowerCase();

  // Go through each word in the dictionary and check if each letter exists in the name (in order). If so, it's a match.
  dictionary.forEach(function(word) {
    if (++count % 10000 == 0 && isVerbose) {
      console.log(count + '/' + total + ' ' + (Math.round(count / total * 100) / 100) + '% (' + word + ')');
    }

    var index = -1;
    var isMatch = word.toLowerCase().split('').every(function(char) {
      index = name.indexOf(char, index + 1);
      return (index != -1);
    });

    if (isMatch) {
      results.push(word);
    }
  });

  return results;
}

// Returns the longest name(s) from an array.
function longestNames(names) {
  var result = [];
  var max = 0;

  if (names.length) {
    // Find the longest name.
    var longest = names.reduce(function (a, b) { return a.length > b.length ? a : b; });

    result = names.filter(function(name) {
      return (name.length == longest.length);
    });
  }

  return result;
}

/*initialize('words.txt', '\r\n', function(words) {
  var input = ['Donald Knuth', 'Alan Turing', 'Claude Shannon', 'Kory Becker'];

  input.forEach(function(name) {
    console.log(name);
    var names = dankNames(name, words);
    console.log(longestNames(names));
  });
});*/

$(function() {
  $('form').submit(function(e) {
    initialize('words.txt', '\r\n', function(words) {
      var names = longestNames(dankNames($('#name').val(), words));
  
      var output = $('#output').text('');
      names.forEach(function(name) {
        output.append(name + '<br/>');
      });
  
      $('#results').fadeIn("slow");
    });

    return false;
  });
});