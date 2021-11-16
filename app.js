function minFunction() {
    var x = document.getElementById("mins");
    document.getElementById("rewrite").innerHTML=x.value;
  }

  function secFunction() {
    var x = document.getElementById("seconds");
    document.getElementById("rewrite2").innerHTML=x.value;
  }

  function sumFunction(){
      let mins = parseInt(document.getElementById('mins').value, 0);
      let seconds = parseInt(document.getElementById('seconds').value, 0);
      let total = (mins*60) + seconds;
   
      let pace200 = ((total/4)*1.062937063).toFixed();
      let pace300 = ((total*(3/8))*1.081585082).toFixed();
      let pace400 = ((total/2)*1.132867133).toFixed();
      let pace800 = (total*1.202797203).toFixed();
      let pace1200 =(total*1.5*1.244755245).toFixed();
      
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


      document.getElementById('sumFunc').innerHTML=total;
  }


  