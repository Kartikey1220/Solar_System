let faqSec = document.querySelector('.faqs-sec');
let ques1 = document.querySelector('.ques-1');
let ans1 = document.querySelector('.Ans1-p');
let ques2 = document.querySelector('.ques-2');
let ans2 = document.querySelector('.ans2-p');
let sun = document.querySelector('.sun-image');
let ques3 = document.querySelector('.ques-3');
let ans3 = document.querySelector('.ans3-p')
let ques4 = document.querySelector('.ques-4');
let ans4 = document.querySelector('.ans4-p')
let ques5 = document.querySelector('.ques-5');
let ans5 = document.querySelector('.ans5-p');
let hermite = document.querySelector('.hermite');
let coper = document.querySelector('.copernicus');
let CarSaturn = document.querySelector('.car-saturn');
let earthSystem = document.querySelector('.earth-system');
let Ans4System = document.querySelector('.planets')
let StartButton = document.querySelector('.Start-button');
let QuesState = false;
const questions = [ques1, ques2, ques3, ques4, ques5 , ];



const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const carobserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      carobserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const carJupiter = document.querySelector('.car-jupiter');
const faqTitle = document.querySelector('.faq-title');
if (faqTitle) {
  observer.observe(faqTitle);
}
if (carJupiter) {
  carobserver.observe(carJupiter);
}

const astronaut = document.querySelector('.astronaut');
const astroobserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      astroobserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

if (astronaut) {
  astroobserver.observe(astronaut);
}
console.log({ earthSystem });

if (ques1 && ques2 && faqSec && ques3 && ques4 && ques5 && astronaut && carJupiter && coper && ans1 && earthSystem) {
  ques1.addEventListener('click', () => {
    faqSec.classList.toggle('grey-color');
   
    QuesState = !QuesState;
    questions.forEach((el, i) => {
      if( i === 0) return;
      const base = `Question${i + 1}-animation`;
      const alt = `${base}B`;
    

      if (QuesState) {
        el.classList.remove(alt);
        el.classList.add(base);
   
      } else {
        el.classList.remove(base);
        el.classList.add(alt);
  }
});
    ques1.classList.remove('Question1-animation', 'Question1-animationB');
    ques2.classList.remove('Laptop', 'Anmol');
    ques3.classList.remove('WidthAndLaptop3', 'BwidthAndAnmol3');
    ques4.classList.remove('WidthAndLaptop4', 'BwidthAndAnmol4');
    ques5.classList.remove('WidthAndLaptop5', 'BwidthAndAnmol5');
    



    if (earthSystem) {
      if (earthSystem.classList.contains('visiblie')) {
        earthSystem.classList.remove('visiblie');
        earthSystem.classList.add('non-visible');
      } else {
        earthSystem.classList.add('visiblie');
        earthSystem.classList.remove('non-visible');
      }
    }
    if (StartButton) {      
      if (StartButton.classList.contains('start-rise')) {
        StartButton.classList.remove('start-rise');
        StartButton.classList.add('start-brise');
      } else {
        StartButton.classList.add('start-rise');
        StartButton.classList.remove('start-brise');
      }
    }

    if (ans1) {
      if (ans1.classList.contains('visiblie')) {
        ans1.classList.remove('visiblie');
        ans1.classList.add('non-visible');
      } else {
        ans1.classList.add('visiblie');
        ans1.classList.remove('non-visible');
      }
    }

    if (coper) {
      if (coper.classList.contains('Right-anim')) {
        coper.classList.remove('Right-anim');
        coper.classList.add('Left-anim');
      } else {
        coper.classList.remove('Left-anim');
        coper.classList.add('Right-anim');
      }
    }

    
    if (astronaut) {
      const hadVisibleA = astronaut.classList.contains('visible');
      if (hadVisibleA) astronaut.classList.remove('visible');

      if (astronaut.classList.contains('ToRight')) {
        astronaut.classList.remove('ToRight');
        astronaut.classList.add('FromRight');
      } else {
        astronaut.classList.remove('FromRight');
        astronaut.classList.add('ToRight');
      }
    }

    if (carJupiter) {
      const hadVisibleC = carJupiter.classList.contains('visible');
      if (hadVisibleC) carJupiter.classList.remove('visible');

      if (carJupiter.classList.contains('ToRight')) {
        carJupiter.classList.remove('ToRight');
        carJupiter.classList.add('FromRight');
      } else {
        carJupiter.classList.remove('FromRight');
        carJupiter.classList.add('ToRight');
      }
    }

    if (ques1) {
      if (ques1.classList.contains('width')) {
        ques1.classList.remove('width');
        ques1.classList.add('Bwidth');
      } else {
        ques1.classList.remove('Bwidth');
        ques1.classList.add('width');
      }
    }

    
  });
}
console.log('sun:', sun);
if (ques2 && faqSec) {
    ques2.addEventListener('click', () => {
    faqSec.classList.toggle('orange-color');
    console.log('clicked');
    QuesState = !QuesState;
    questions.forEach((el, i) => {
    
      const base = `Question${i + 1}-animation`;
      const alt = `${base}B`;

      if (QuesState) {
          el.classList.remove(alt);
          el.classList.add(base);
      } else {
          el.classList.remove(base);
          el.classList.add(alt);
      }
    });
    ques3.classList.remove('WidthAndLaptop3', 'BwidthAndAnmol3');
   

   
    if (StartButton) {      
      if (StartButton.classList.contains('start-rise')) {
        StartButton.classList.remove('start-rise');
        StartButton.classList.add('start-brise');
      } else {
        StartButton.classList.add('start-rise');
        StartButton.classList.remove('start-brise');
      }
    }
    if (sun) {
      if (sun.classList.contains('Right-anim')) {
          sun.classList.remove('Right-anim');
          sun.classList.add('Left-anim');
      } else {
          sun.classList.remove('Left-anim');
          sun.classList.add('Right-anim');
      }
    }
    if (ans2) {
      if (ans2.classList.contains('visiblie')) {
        ans2.classList.remove('visiblie');
        ans2.classList.add('non-visible');
      } else {
        ans2.classList.add('visiblie');
        ans2.classList.remove('non-visible');
      }
    }
    if (QuesState) {
      ques2.classList.remove('Laptop');
      ques2.classList.add('Anmol');
    } else {
      ques2.classList.remove('Anmol');
      ques2.classList.add('Laptop');
  }
    




    if (astronaut) {
      const hadVisibleA = astronaut.classList.contains('visible');
      if (hadVisibleA) astronaut.classList.remove('visible');

      if (astronaut.classList.contains('ToRight')) {
        astronaut.classList.remove('ToRight');
        astronaut.classList.add('FromRight');
      } else {
        astronaut.classList.remove('FromRight');
        astronaut.classList.add('ToRight');
      }
    }

    if (carJupiter) {
      const hadVisibleC = carJupiter.classList.contains('visible');
      if (hadVisibleC) carJupiter.classList.remove('visible');

      if (carJupiter.classList.contains('ToRight')) {
        carJupiter.classList.remove('ToRight');
        carJupiter.classList.add('FromRight');
      } else {
        carJupiter.classList.remove('FromRight');
        carJupiter.classList.add('ToRight');
      }
    }
  });
}
 

if (ques3 && faqSec) {
    ques3.addEventListener('click', () => {
    faqSec.classList.toggle('golden-color');
    console.log('clicked');
    QuesState = !QuesState;
    questions.forEach((el, i) => {
    
      const base = `Question${i+1}-animation`;
      const alt = `${base}B`;

      if (QuesState) {
          el.classList.remove(alt);
          el.classList.add(base);
      } else {
          el.classList.remove(base);
          el.classList.add(alt);
      }
    });
    ques2.classList.remove('Laptop','Anmol');
    ques4.classList.remove('WidthAndLaptop4', 'BwidthAndAnmol4');
    ques5.classList.remove('WidthAndLaptop5', 'BwidthAndAnmol5')

   
    if (StartButton) {      
      if (StartButton.classList.contains('start-rise')) {
        StartButton.classList.remove('start-rise');
        StartButton.classList.add('start-brise');
      } else {
        StartButton.classList.add('start-rise');
        StartButton.classList.remove('start-brise');
      }
    }
    if (CarSaturn) {
      if (CarSaturn.classList.contains('Right-anim')) {
          CarSaturn.classList.remove('Right-anim');
          CarSaturn.classList.add('Left-anim');
      } else {
          CarSaturn.classList.remove('Left-anim');
          CarSaturn.classList.add('Right-anim');
      }
    }
    if (ans3) {
      if (ans3.classList.contains('visiblie')) {
        ans3.classList.remove('visiblie');
        ans3.classList.add('non-visible');
      } else {
        ans3.classList.add('visiblie');
        ans3.classList.remove('non-visible');
      }
    }
    // if (ques3) {
    //   if (ques3.classList.contains('WidthAndLaptop3')) {
    //     ques3.classList.remove('WidthAndLaptop3');
    //     ques3.classList.add('BwidthAndAnmol3');
    //   } else {
    //     ques3.classList.remove('BwidthAndAnmol3');
    //     ques3.classList.add('WidthAndLaptop3');
    //   }
    // }
    if (ques3) {
      if (ques3.classList.contains('WidthAndLaptop3')) {
         ques3.classList.remove('WidthAndLaptop3');
        ques3.classList.add('BwidthAndAnmol3'); // down + expand
      } else {
        ques3.classList.remove('BwidthAndAnmol3');
        ques3.classList.add('WidthAndLaptop3'); // up + compress
      }
    }

    
    




    if (astronaut) {
      const hadVisibleA = astronaut.classList.contains('visible');
      if (hadVisibleA) astronaut.classList.remove('visible');

      if (astronaut.classList.contains('ToRight')) {
        astronaut.classList.remove('ToRight');
        astronaut.classList.add('FromRight');
      } else {
        astronaut.classList.remove('FromRight');
        astronaut.classList.add('ToRight');
      }
    }

    if (carJupiter) {
      const hadVisibleC = carJupiter.classList.contains('visible');
      if (hadVisibleC) carJupiter.classList.remove('visible');

      if (carJupiter.classList.contains('ToRight')) {
        carJupiter.classList.remove('ToRight');
        carJupiter.classList.add('FromRight');
      } else {
        carJupiter.classList.remove('FromRight');
        carJupiter.classList.add('ToRight');
      }
    }
  });
}
if (ques4 && faqSec) {
    ques4.addEventListener('click', () => {
    faqSec.classList.toggle('blue-color');
    console.log('clicked');
    QuesState = !QuesState;
    questions.forEach((el, i) => {
      if(i === 3) return; 
      const base = `Question${i+1}-animation`;
      const alt = `${base}B`;

      if (QuesState) {
          el.classList.remove(alt);
          el.classList.add(base);
      } else {
          el.classList.remove(base);
          el.classList.add(alt);
      }
    });
    ques2.classList.remove('Laptop','Anmol');
    ques3.classList.remove('WidthAndLaptop3', 'BwidthAndAnmol3');
    ques4.classList.remove('Question4-animation', 'Question4-animationB');
    
    if (StartButton) {      
      if (StartButton.classList.contains('start-rise')) {
        StartButton.classList.remove('start-rise');
        StartButton.classList.add('start-brise');
      } else {
        StartButton.classList.add('start-rise');
        StartButton.classList.remove('start-brise');
      }
    }
    if(faqTitle){
      if(faqTitle.classList.contains('faqTitle-anim')){
        faqTitle.classList.remove('faqTitle-anim');
        faqTitle.classList.add('faqTitle-Banim')
    
      }else{
        faqTitle.classList.remove('faqTitle-Banim')
        faqTitle.classList.add('faqTitle-anim')
      }
    }

    if (Ans4System) {
      if (Ans4System.classList.contains('Right-anim')) {
          Ans4System.classList.remove('Right-anim');
          Ans4System.classList.add('Left-anim');
      } else {
          Ans4System.classList.remove('Left-anim');
          Ans4System.classList.add('Right-anim');
      }
    }
    if (ans4) {
      if (ans4.classList.contains('visiblie')) {
        ans4.classList.remove('visiblie');
        ans4.classList.add('non-visible');
      } else {
        ans4.classList.add('visiblie');
        ans4.classList.remove('non-visible');
      }
    }
    if (ques4) {
      if (ques4.classList.contains('WidthAndLaptop4')) {
        ques4.classList.remove('WidthAndLaptop4');
        ques4.classList.add('BwidthAndAnmol4');
      } else {
        ques4.classList.remove('BwidthAndAnmol4');
        ques4.classList.add('WidthAndLaptop4');
      }
    }

    
    




    if (astronaut) {
      const hadVisibleA = astronaut.classList.contains('visible');
      if (hadVisibleA) astronaut.classList.remove('visible');

      if (astronaut.classList.contains('ToRight')) {
        astronaut.classList.remove('ToRight');
        astronaut.classList.add('FromRight');
      } else {
        astronaut.classList.remove('FromRight');
        astronaut.classList.add('ToRight');
      }
    }

    if (carJupiter) {
      const hadVisibleC = carJupiter.classList.contains('visible');
      if (hadVisibleC) carJupiter.classList.remove('visible');

      if (carJupiter.classList.contains('ToRight')) {
        carJupiter.classList.remove('ToRight');
        carJupiter.classList.add('FromRight');
      } else {
        carJupiter.classList.remove('FromRight');
        carJupiter.classList.add('ToRight');
      }
    }
  });
}
if (ques5 && faqSec) {
    ques5.addEventListener('click', () => {
    faqSec.classList.toggle('Darkgray-color');
    console.log('clicked');
    QuesState = !QuesState;
    questions.forEach((el, i) => {
    
      const base = `Question${i+1}-animation`;
      const alt = `${base}B`;

      if (QuesState) {
          el.classList.remove(alt);
          el.classList.add(base);
      } else {
          el.classList.remove(base);
          el.classList.add(alt);
      }
    });
    ques2.classList.remove('Laptop','Anmol');
    ques3.classList.remove('WidthAndLaptop3', 'BwidthAndAnmol3');
    ques4.classList.remove('WidthAndLaptop4', 'BwidthAndAnmol4');


   
    if (StartButton) {      
      if (StartButton.classList.contains('start-rise')) {
        StartButton.classList.remove('start-rise');
        StartButton.classList.add('start-brise');
      } else {
        StartButton.classList.add('start-rise');
        StartButton.classList.remove('start-brise');
      }
    }
    if (hermite) {
      if (hermite.classList.contains('Right-anim')) {
          hermite.classList.remove('Right-anim');
          hermite.classList.add('Left-anim');
      } else {
          hermite.classList.remove('Left-anim');
          hermite.classList.add('Right-anim');
      }
    }
    if (ans5) {
      if (ans5.classList.contains('visiblie')) {
        ans5.classList.remove('visiblie');
        ans5.classList.add('non-visible');
      } else {
        ans5.classList.add('visiblie');
        ans5.classList.remove('non-visible');
      }
    }
   
    if (ques5) {
      if (ques5.classList.contains('WidthAndLaptop5')) {
         ques5.classList.remove('WidthAndLaptop5');
        ques5.classList.add('BwidthAndAnmol5'); // down + expand
      } else {
        ques5.classList.remove('BwidthAndAnmol5');
        ques5.classList.add('WidthAndLaptop5'); // up + compress
      }
    }

    
    




    if (astronaut) {
      const hadVisibleA = astronaut.classList.contains('visible');
      if (hadVisibleA) astronaut.classList.remove('visible');

      if (astronaut.classList.contains('ToRight')) {
        astronaut.classList.remove('ToRight');
        astronaut.classList.add('FromRight');
      } else {
        astronaut.classList.remove('FromRight');
        astronaut.classList.add('ToRight');
      }
    }

    if (carJupiter) {
      const hadVisibleC = carJupiter.classList.contains('visible');
      if (hadVisibleC) carJupiter.classList.remove('visible');

      if (carJupiter.classList.contains('ToRight')) {
        carJupiter.classList.remove('ToRight');
        carJupiter.classList.add('FromRight');
      } else {
        carJupiter.classList.remove('FromRight');
        carJupiter.classList.add('ToRight');
      }
    }
  });
}
const center = document.querySelector('.sun');
const container = document.querySelector('.planets');

// Define each planet's radius and speed
const planets = [
  { selector: '.mercury', radius: 60, speed: 0.04, angle: 0 },
  { selector: '.venus', radius: 120, speed: 0.03, angle: 0 },
  { selector: '.earth', radius: 180, speed: 0.02, angle: 0 },
  { selector: '.mars', radius: 220, speed: 0.018, angle: 0 },
  { selector: '.jupiter', radius: 260, speed: 0.01, angle: 0 },
  { selector: '.saturn', radius: 300, speed: 0.008, angle: 0 },
  { selector: '.uranus', radius: 340, speed: 0.006, angle: 0 },
  { selector: '.neptune', radius: 380, speed: 0.005, angle: 0 }
];

// Attach DOM elements
planets.forEach(planet => {
  planet.el = document.querySelector(planet.selector);
});

function getCenterCoords() {
  const centerRect = center.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x: centerRect.left - containerRect.left + centerRect.width / 2,
    y: centerRect.top - containerRect.top + centerRect.height / 2
  };
}

function animate() {
  const { x: centerX, y: centerY } = getCenterCoords();

  planets.forEach(planet => {
    const x = centerX + planet.radius * Math.cos(planet.angle) - planet.el.offsetWidth / 2;
    const y = centerY + planet.radius * Math.sin(planet.angle) - planet.el.offsetHeight / 2;
    planet.el.style.left = `${x}px`;
    planet.el.style.top = `${y}px`;
    planet.angle += planet.speed;
  });

  requestAnimationFrame(animate);
}

animate();