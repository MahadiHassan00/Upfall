const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravityStatus = document.getElementById("gravityStatus");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const startButton = document.getElementById("startButton");

const W = canvas.width, H = canvas.height;
const keys = new Set();

const world = {
  gravity: 1,
  gravityStrength: 0.48,
  friction: 0.82,
  acceleration: 0.62,
  maxSpeed: 5.2,
  jumpPower: 10.8,
  running: false,
  won: false,
  dead: false,
  cameraShake: 0
};

const platforms = [
  {x:0,y:500,w:960,h:40,type:"solid"},
  {x:90,y:410,w:180,h:16,type:"platform"},
  {x:340,y:330,w:170,h:16,type:"platform"},
  {x:610,y:420,w:190,h:16,type:"platform"},
  {x:150,y:190,w:170,h:16,type:"platform"},
  {x:430,y:150,w:190,h:16,type:"platform"},
  {x:730,y:250,w:140,h:16,type:"platform"},
  {x:0,y:0,w:960,h:18,type:"ceiling"}
];

const spikes = [
  {x:290,y:484,w:65,h:16},
  {x:530,y:484,w:75,h:16},
  {x:810,y:404,w:42,h:16},
  {x:350,y:314,w:50,h:16}
];

const exit = {x:850,y:190,w:42,h:58};

const player = {
  x:45,y:450,w:26,h:34,
  vx:0,vy:0,
  grounded:false,
  color:"#53f4ff",
  spawnX:45,spawnY:450
};

function resetGame() {
  player.x=player.spawnX; player.y=player.spawnY;
  player.vx=0; player.vy=0; player.grounded=false;
  world.gravity=1; world.running=true; world.won=false; world.dead=false;
  gravityStatus.textContent="↓ DOWN";
  overlay.classList.add("hidden");
}
function showOverlay(title, text, eyebrow, buttonText) {
  overlayTitle.textContent=title;
  overlayText.textContent=text;
  overlayEyebrow.textContent=eyebrow;
  startButton.textContent=buttonText;
  overlay.classList.remove("hidden");
}
startButton.addEventListener("click", resetGame);

window.addEventListener("keydown", e => {
  if(["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key)) e.preventDefault();
  const k=e.key.toLowerCase();
  if(!keys.has(k)) {
    if(k==="g" && world.running) flipGravity();
    if(k===" " && world.running) jump();
    if(k==="r") resetGame();
  }
  keys.add(k);
  if((k==="enter") && !world.running) resetGame();
});
window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur",()=>keys.clear());

function flipGravity() {
  world.gravity *= -1;
  player.vy = 0;
  player.grounded = false;
  gravityStatus.textContent = world.gravity===1 ? "↓ DOWN" : "↑ UP";
  world.cameraShake=5;
}
function jump() {
  if(player.grounded) {
    player.vy = -world.gravity * world.jumpPower;
    player.grounded=false;
  }
}
function rectsOverlap(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function update() {
  if(!world.running) return;
  const left=keys.has("a")||keys.has("arrowleft");
  const right=keys.has("d")||keys.has("arrowright");
  if(left) player.vx-=world.acceleration;
  if(right) player.vx+=world.acceleration;
  if(!left&&!right) player.vx*=world.friction;
  player.vx=Math.max(-world.maxSpeed,Math.min(world.maxSpeed,player.vx));

  const oldY=player.y;
  player.vy += world.gravity*world.gravityStrength;
  player.vy=Math.max(-12,Math.min(12,player.vy));
  player.x+=player.vx;
  player.y+=player.vy;
  player.grounded=false;

  // World bounds
  player.x=Math.max(0,Math.min(W-player.w,player.x));

  // Platform collision: only resolve when crossing a platform face in gravity direction.
  for(const p of platforms) {
    if(player.x+player.w>p.x && player.x<p.x+p.w) {
      if(world.gravity===1 && oldY+player.h<=p.y && player.y+player.h>=p.y) {
        player.y=p.y-player.h; player.vy=0; player.grounded=true;
      } else if(world.gravity===-1 && oldY>=p.y+p.h && player.y<=p.y+p.h) {
        player.y=p.y+p.h; player.vy=0; player.grounded=true;
      }
    }
  }

  // Hazards
  for(const s of spikes) {
    const hitbox={x:s.x+4,y:s.y+5,w:s.w-8,h:s.h-5};
    if(rectsOverlap(player,hitbox)) {
      world.running=false; world.dead=true;
      showOverlay("SYSTEM FAILURE","You hit a hazard. Try flipping gravity at the right moment.","MISSION FAILED","TRY AGAIN");
      return;
    }
  }

  // Exit
  if(rectsOverlap(player,exit)) {
    world.running=false; world.won=true;
    showOverlay("LEVEL COMPLETE","You used gravity to escape the facility. Nice work!","MISSION SUCCESS","PLAY AGAIN");
  }

  if(player.y>H+70 || player.y<-70) {
    world.running=false; world.dead=true;
    showOverlay("LOST IN SPACE","You fell outside the facility. Restart and try again.","MISSION FAILED","TRY AGAIN");
  }
}

function drawBackground() {
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"#0b1325"); grad.addColorStop(1,"#080b16");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#1b2940"; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // ambient dots
  for(let i=0;i<55;i++){
    const x=(i*173)%W, y=(i*97)%H;
    ctx.fillStyle=i%4===0?"#53f4ff55":"#8aa4d522";
    ctx.fillRect(x,y,2,2);
  }
}
function drawPlatforms() {
  for(const p of platforms) {
    ctx.fillStyle=p.type==="solid"?"#18243a":"#243653";
    ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle=p.type==="solid"?"#536b91":"#53f4ff";
    ctx.fillRect(p.x,p.y,p.w,3);
    ctx.shadowColor="#53f4ff";ctx.shadowBlur=10;
    ctx.fillRect(p.x,p.y,p.w,2);ctx.shadowBlur=0;
  }
}
function drawSpikes() {
  for(const s of spikes) {
    const count=Math.max(2,Math.floor(s.w/16));
    ctx.fillStyle="#ff4f83";ctx.shadowColor="#ff4f83";ctx.shadowBlur=12;
    ctx.beginPath();
    for(let i=0;i<count;i++){
      const x=s.x+i*(s.w/count), width=s.w/count;
      ctx.moveTo(x,s.y+s.h);ctx.lineTo(x+width/2,s.y);ctx.lineTo(x+width,s.y+s.h);
    }
    ctx.fill();ctx.shadowBlur=0;
  }
}
function drawExit() {
  ctx.save();
  ctx.shadowColor="#a78bfa";ctx.shadowBlur=22;
  ctx.strokeStyle="#a78bfa";ctx.lineWidth=3;
  ctx.strokeRect(exit.x,exit.y,exit.w,exit.h);
  ctx.fillStyle="#a78bfa22";ctx.fillRect(exit.x,exit.y,exit.w,exit.h);
  ctx.fillStyle="#e5d9ff";ctx.fillRect(exit.x+exit.w-7,exit.y+exit.h/2-3,4,6);
  ctx.restore();
}
function drawPlayer() {
  ctx.save();
  ctx.shadowColor=player.color;ctx.shadowBlur=18;
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;
  ctx.fillStyle="#071018";
  // visor
  ctx.fillRect(player.x+5,player.y+8,player.w-10,7);
  ctx.fillStyle="#d9ffff";
  ctx.fillRect(player.x+player.w-8,player.y+10,3,3);
  ctx.restore();
}
function drawGravityIndicator() {
  ctx.fillStyle="#a7b7d4";ctx.font="12px Inter";
  ctx.fillText(world.gravity===1?"GRAVITY ↓":"GRAVITY ↑",20,30);
  ctx.fillStyle="#53f4ff";ctx.fillRect(20,40,world.gravity===1?42:18,3);
}
function render() {
  ctx.save();
  if(world.cameraShake>0){ctx.translate((Math.random()-.5)*world.cameraShake,(Math.random()-.5)*world.cameraShake);world.cameraShake*=.75;}
  drawBackground();drawPlatforms();drawSpikes();drawExit();drawPlayer();drawGravityIndicator();
  ctx.restore();
}
function loop() { update();render();requestAnimationFrame(loop); }
render();loop();
