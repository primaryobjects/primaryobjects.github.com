$(function() {
  $("nav ul li a[href^='#']").on('click', function(e) {
     // prevent default anchor click behavior
     e.preventDefault();

     // store hash
     var hash = this.hash;

     // animate
     $('html, body').animate({
         scrollTop: $(hash).offset().top
       }, 300, function(){

         // when done, add hash to url
         // (default click behaviour)
         window.location.hash = hash;
       });
  });

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
