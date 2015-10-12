$(document).ready(function() {
  (function($){
    var win = $(window);
    
    $.fn.viewportOffset = function() {
      var offset = $(this).offset();
      
      return {
        top: offset.top - win.scrollTop(),
        left: offset.left - win.scrollLeft()
      };
    };
  })(jQuery);

  svg_ie_fix();
  $(this).scrollTop(0); // prevent the parallax bug when scrolltop != 0 after a page refresh

  // Post overlay 
  $('.js-post-overlay').hover(
    function() {
      $(this).addClass("-expanded");
    }, 
    function() {
      $(this).removeClass("-expanded");
    }
  );

  $('.js-post-overlay-action').click(function() {
    $(this).parents('.js-post-overlay').toggleClass('-expanded');
  });

  // Parallax
  var parallax_elements = Array();
  var doc_offset = $(this).scrollTop();

  $('[data-parallax-warp]').each(function(index, el) {
    var $el = $(this);

    $el.org_offset = $el.viewportOffset().top;
    $el.parallax_warp = $el.data('parallax-warp');

    parallax_elements.push($el);
  });

  // Calculate Parallax offset if page is not on top
 /* if(doc_offset > 0) {
    $.each(parallax_elements, function(index, el){

      // doc: 250
      // org: 27
      // scroll -35
      console.log("doc_offset/warp", doc_offset/el.parallax_warp);
      // el.org_offset - (doc_offset/el.parallax_warp);

      var init_offset = el.org_offset+doc_offset/el.parallax_warp;

      // console.log("new_offset", new_offset);

      el.css({ top: init_offset }); 
    }); 
  } */

  $(document).scroll(function() {
    doc_offset = $(this).scrollTop();

    // Fade outs
    $('[data-fade-out]').each(function(index, el) {
      var $el = $(this);
      var trigger = $el.data('fade-out');
      var duration = $(window).height()/100*$el.data('fade-out-length');

      if(doc_offset < trigger) {
        $el.css({ opacity: 1 });
      }
      else if(doc_offset > trigger + duration) {
        $el.css({ opacity: 0 });
      }
      else {
        opacity = 1-((doc_offset-trigger)/(duration));
        $el.css({ opacity: opacity });
      }
    });

    // Parallax
    $.each(parallax_elements, function(index, el){
      var new_offset = el.org_offset-doc_offset/el.parallax_warp;

      /*console.log("doc offset / warp while scrolling", doc_offset/el.parallax_warp)
      console.log("doc_offset while scrolling", doc_offset);
      console.log("el offset after scrolling", new_offset);*/

      el.css({ top: new_offset }); 
    }); 
  });

  function svg_ie_fix() {
    /MSIE|Trident/.test(navigator.userAgent) && document.addEventListener('DOMContentLoaded', function () {
      [].forEach.call(document.querySelectorAll('svg'), function (svg) {
        var use = svg.querySelector('use'); 

        if (use) {
          var object = document.createElement('object');
          object.data = use.getAttribute('xlink:href');
          object.className = svg.getAttribute('class');
          svg.parentNode.replaceChild(object, svg);
        }
      });
    });
  }
});