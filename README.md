# Retro 2D Game Engine (in TypeScript)

## Live demo:

https://dusandimitric.github.io/retro-2d-game-engine-demo/

![screenshot](https://framapic.org/B1mgKPxP1smv/4Kida0z151O7 'Screenshot')

## Run it locally:

#### 1. Step

Run:

```
make
```

#### 2. Step

Serve the root directory and open index.html in your browser

```
make serve
```

## Check for TypeScript validity:

TS compilation should run without errors:

```
npx tsc -p tsconfig.json
```

## Color palette:

(Heretic) https://zdoom.org/wiki/Palette

## Attribution:

### Sound FX

- MP5 SMG 9mm - By GunGuru from http://soundbible.com/2091-MP5-SMG-9mm.html
- BULLET HITS SOUND FX - by ActionVFX from https://www.actionvfx.com/collections/free-vfx/category
- 5 Hit Sounds + Dying - By TinyWorlds from https://opengameart.org/content/5-hit-sounds-dying

### Graphics

- https://www.spriters-resource.com/pc_computer/starcraft/sheet/60003/

## Controls

### Keyboard

W, A, S, D - movement
Mouse/Trackpad - Aiming / Shooting

### Gamepad

**NOTICE:** Keyboard/Mouse will not work while using a Gamepad. Unplug the
gamepad in order to keep using the Keyboard/Mouse.

Left analog stick - Movement
Right analog stick - Aiming
R1 - Shoot

Inspired by [Red Faction 2 controls](https://www.gamesdatabase.org/Media/SYSTEM/Sony_Playstation_2/manual/Formated/Red_Faction_2_-_2002_-_THQ,_Inc..pdf).

### Game State Machine

Overview of game states and possible transitions:

```
                     -------------
                   /               \
                  / ----------      Paused
                 v v           \   /  
Loading ---> Main Menu ---> Playing ---> Level Cleared ---> Victory
                             /  ^         /
                            v    \       /
                     Game Over     -----
```
