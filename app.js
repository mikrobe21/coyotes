/*
function minFunction() {
    var x = document.getElementById("mins");
    document.getElementById("rewrite").innerHTML=x.value;
  }

  function secFunction() {
    var x = document.getElementById("seconds");
    document.getElementById("rewrite2").innerHTML=x.value;
  }
*/
  function sumFunction(){
      let mins = parseInt(document.getElementById('mins').value, 0);
      let seconds = parseInt(document.getElementById('seconds').value, 0);
      let total = (mins*60) + seconds;
   
      let pace200 = ((total/4)*1.062937063).toFixed();
      let pace300 = ((total*(3/8))*1.081585082).toFixed();
      let pace400 = ((total/2)*1.132867133).toFixed();
      let pace800 = (total*1.202797203).toFixed();
      let pace1200 =(total*1.5*1.244755245).toFixed();
      //math for mm:ss
      let pace200mmss = new Date(pace200 * 1000).toISOString().substr(14, 5)
      let pace300mmss = new Date(pace300 * 1000).toISOString().substr(14, 5)
      let pace400mmss = new Date(pace400 * 1000).toISOString().substr(14, 5)
      let pace800mmss = new Date(pace800 * 1000).toISOString().substr(14, 5)
      let pace1200mmss = new Date(pace1200 * 1000).toISOString().substr(14, 5)
      //more math for mm:ss
      let split400mmss = new Date(parseInt(pace400) * 1000).toISOString().substr(14, 5)
      let split800mmss = new Date(parseInt(pace800/2) * 1000).toISOString().substr(14, 5)
      let split1200mmss = new Date(parseInt(pace1200/3) * 1000).toISOString().substr(14, 5)
      //total time paces
      document.getElementById('pace200').innerHTML=pace200;
      document.getElementById('pace300').innerHTML=pace300;
      document.getElementById('pace400').innerHTML=pace400;
      document.getElementById('pace800').innerHTML=pace800;
      document.getElementById('pace1200').innerHTML=pace1200;
      //split per 400m paces
      document.getElementById('split400').innerHTML=parseInt(pace400);
      document.getElementById('split800').innerHTML=parseInt(pace800/2);
      document.getElementById('split1200').innerHTML=parseInt(pace1200/3);
      //total time in mm:ss
      document.getElementById('pace200mmss').innerHTML=pace200mmss;
      document.getElementById('pace300mmss').innerHTML=pace300mmss;
      document.getElementById('pace400mmss').innerHTML=pace400mmss;
      document.getElementById('pace800mmss').innerHTML=pace800mmss;
      document.getElementById('pace1200mmss').innerHTML=pace1200mmss;

      //split per 400m in mm:ss
      document.getElementById('split400mmss').innerHTML=split400mmss;
      document.getElementById('split800mmss').innerHTML=split800mmss;
      document.getElementById('split1200mmss').innerHTML=split1200mmss;

      
  }









  /* code I didn't write */
(function (window, document) {

  // we fetch the elements each time because docusaurus removes the previous
  // element references on page navigation
  function getElements() {
      return {
          layout: document.getElementById('layout'),
          menu: document.getElementById('menu'),
          menuLink: document.getElementById('menuLink')
      };
  }

  function toggleClass(element, className) {
      var classes = element.className.split(/\s+/);
      var length = classes.length;
      var i = 0;

      for (; i < length; i++) {
          if (classes[i] === className) {
              classes.splice(i, 1);
              break;
          }
      }
      // The className is not found
      if (length === classes.length) {
          classes.push(className);
      }

      element.className = classes.join(' ');
  }

  function toggleAll() {
      var active = 'active';
      var elements = getElements();

      toggleClass(elements.layout, active);
      toggleClass(elements.menu, active);
      toggleClass(elements.menuLink, active);
  }
  
  function handleEvent(e) {
      var elements = getElements();
      
      if (e.target.id === elements.menuLink.id) {
          toggleAll();
          e.preventDefault();
      } else if (elements.menu.className.indexOf('active') !== -1) {
          toggleAll();
      }
  }
  
  document.addEventListener('click', handleEvent);

}(this, this.document));
  