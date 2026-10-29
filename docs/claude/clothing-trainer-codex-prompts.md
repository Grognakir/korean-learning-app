# Промпт Codex — стикер и аватарки тренажёра одежды (2급 10과)

Стиль — тот же, что у персонажа `public/images/clothing-game/test2/base_happy.png` и иконок `test2/icons`. Героиня — молодая девушка, волосы в духе киберпанка, очень эмоциональная мимика.

```text
Task: generate a cartoon sticker character with 8 emotions and 5 family avatars for a Korean-learning app (lesson 10, clothing trainer). Use the built-in image generation tool.

STYLE REFERENCE
- Use public/images/clothing-game/test2/base_happy.png as the STYLE reference (same artist look as the existing clothing icons in public/images/clothing-game/test2/icons): bold black hand-inked outline with varied line weight, angular sharp cel shadows, flat colors, semi-stylized anime-comic proportions, expressive face.
- Copy ONLY the drawing style. Do NOT copy that man's face, body, beard or hair. All characters below are new.

COMMON RULES FOR EVERY IMAGE
- Square 1024x1024, head and shoulders, front three-quarter view, character centered, occupying ~80% of the height.
- Thick white die-cut sticker border (~24px) around the whole silhouette.
- Solid flat #00FF00 background, no shadow, no gradient, no texture. No green or teal anywhere on the character.
- No text, no frames, no props, no hands in frame (except "thinking" and "shock").
- Readable at 64–96px: strong silhouette, big clear facial expression, no fine hatching.

STEP 1 — MAIN CHARACTER, idle (this becomes the identity reference)
Young Korean woman, about 20 years old, energetic and very expressive. Cyberpunk-inspired hair: chin-length choppy bob with blunt bangs, hot magenta-pink fading to electric violet, with a few bright electric-blue streaks; slight neon sheen highlights. Big expressive dark eyes with a sharp eyeliner wing, small nose, glossy pink lips, two small silver ear piercings. Wearing a black cropped bomber jacket with a magenta trim collar over a white top. Playful confident expression, small closed-mouth smile with one corner raised, looking at the viewer.
Save: public/images/lesson-sticker/lesson10-girl/idle.png

STEP 2 — EMOTIONS (exaggerated, cartoon-level, very emotional)
Generate each one using idle.png as the identity reference. Keep the same face shape, hairstyle and hair colors, outfit, piercings, outline thickness and framing; change only the expression and head tilt. Push expressions far, like a reaction sticker.
- blink.png — identical to idle in every detail, only the eyes closed in a relaxed blink (curved lines).
- hover.png — curious and excited: eyebrows shot up, eyes wide and sparkling, head tilted, mouth in a small open "oh?" smile, hair bouncing slightly.
- thinking.png — index finger pressed to her chin, eyes rolled up to the side, lips pushed into a pout, one eyebrow raised high, small "hmm" squiggle lines near the head (no text).
- happy.png — ecstatic: eyes squeezed into upward arcs, huge open-mouth grin, strong blush, hair flying up, sparkles and small hearts around the head.
- oops.png — cringing: wide awkward grin with clenched teeth, one eye squeezed shut, big sweat drop on the temple, shoulders raised.
- shock.png — horrified: both hands on her cheeks, eyes huge with tiny pupils, jaw dropped in a long O, hair standing up, face slightly pale, jagged shock lines around the head.
- proud.png — triumphant: chin up, wide confident grin, star-shaped sparkles in the eyes, a peace sign near her face, stars and confetti around the head.
Save each to public/images/lesson-sticker/lesson10-girl/<name>.png

STEP 3 — AVATARS
Same drawing style as idle.png (style only, new faces, natural hair colors). Friendly calm smile, same framing and border.
- friend.png — young Korean man, early twenties, short black tousled hair, navy hoodie.
- brother.png — Korean boy about 12, round face, short black hair with a cowlick, cheeky grin, red t-shirt.
- mom.png — Korean woman, late forties, short wavy dark hair, warm smile, small earrings, soft pink blouse.
- dad.png — Korean man, early fifties, short neat black hair greying at the temples, rectangular glasses, light blue collared shirt.
- grandma.png — Korean grandmother, seventies, short curly grey permed hair, kind smiling eyes, purple cardigan.
Save to public/images/clothing-game/prod/avatars/<name>.png

STEP 4 — POST-PROCESS (Python, Pillow + numpy)
- Keep the 1024px originals, previews and generation-prompts.json in content/reference/art-sources/<same subpath>/ (not in public/); public/ gets only the final PNGs.
- Remove the #00FF00 background to RGBA (tolerance for anti-aliased edges, despill green from edge pixels), RGB=0 where alpha=0.
- Export sticker emotions at 256x256 and avatars at 128x128, same filenames.

STEP 5 — SELF-CHECK
- Put all 8 emotions side by side in a preview image and confirm face, hair colors, outfit, piercings and border match; regenerate any frame that drifted, using idle.png as reference.
- Put the girl and the 5 avatars side by side and confirm the line and shading style matches base_happy.png and the clothing icons.
- Confirm no green fringe remains on edges.
- Save the exact prompts used to content/reference/art-sources/lesson-sticker/lesson10-girl/generation-prompts.json and content/reference/art-sources/clothing-game/avatars/generation-prompts.json.
Do not modify any app code.
```

---

# Промпт Codex — иконки одежды и тайлы узоров

```text
Task: generate the clothing icon catalog (35 items) and 4 pattern tiles for the lesson-10 clothing trainer of a Korean-learning app. Use the built-in image generation tool. Do not modify any app code.

STYLE (match exactly)
- Style reference: the sticker girl public/images/lesson-sticker/lesson10-girl/idle.png (1024px source: content/reference/art-sources/lesson-sticker/lesson10-girl/sources/idle.png). Copy ONLY her drawing style, so the icons look like part of the same sticker pack: the same bold black ink outline with the same varied line weight, the same sharp cel-shadow shapes and glossy highlight strokes, the same thick white die-cut sticker border (~24px at 1024) around the silhouette. Do NOT use the older test2 icons as style reference.
- Only the style, line and shading follow the sticker, not its colors. Every recolorable part is drawn WHITE with neutral-gray cel shadows (the app tints it by multiply). Non-recolorable parts (soles, buckles, zippers, metal, lenses, watch face, jewelry stones) are drawn in mid/dark neutral gray or as noted.
- One item per image, catalog flat-lay or clean three-quarter view, newly composed. No person, body, skin, mannequin, hanger, hands, text, logos, brand marks, props or other clothing.
- Square 1024x1024, solid flat #00FF00 background (same as the sticker), no floor shadow, no noise, fully inside the canvas, crisp closed silhouette for exact mask extraction. No green anywhere on the item.
- Scale: garments occupy ~75% of the canvas; shoes/bag/hat ~65%; small accessories (tie, gloves, socks, watch) ~55%; tiny accessories (ring, earrings, glasses) ~45% — never smaller, the icons are shown at 64–80px.

GENERATE ALL (id — Korean — description). The older test2/prod icons are a different style: regenerate them too.
Tops
- dress_shirt — 와이셔츠 — long-sleeve dress shirt with pointed collar and buttons, flat lay.
- tshirt — 티셔츠 — plain crew-neck short-sleeve t-shirt, flat lay.
- blouse — 블라우스 — women's blouse with soft round collar, small buttons, slightly puffed long sleeves.
Bottoms
- pants — 바지 — straight-leg trousers, folded once, belt loops and crease.
- jeans — 청바지 — straight jeans, folded once, visible stitching and rivets. EXCEPTION: drawn in medium denim blue with darker blue shadows (not recolorable).
- skirt — 치마 — knee-length A-line skirt with a waistband.
- shorts — 반바지 — casual knee-length shorts with drawstring.
Full outfits
- suit — 정장/양복 — matching blazer and trousers shown together, blazer slightly overlapping the folded trousers, no shirt or tie.
- dress — 원피스 — knee-length dress with short sleeves and a fitted waist.
- tracksuit — 운동복 — zip-up track jacket and track pants together, side stripes drawn as plain outlines (white like the fabric).
- hiking_wear — 등산복 — technical hiking shell jacket with hood and zip pockets plus hiking trousers together; zippers dark gray.
- hanbok — 한복 — women's hanbok: short jeogori with goreum ribbon and a full long chima skirt, front view.
- school_uniform — 교복 — school blazer with simple badge outline (no text) and a pleated skirt together.
- swimsuit — 수영복 — one-piece swimsuit with simple straps.
Outerwear
- jacket — 재킷 — single-breasted blazer, notch lapels, one button, flap pockets, flat lay.
- coat — 코트 — long belted wool coat, flat lay.
- padded_jacket — 점퍼 — short puffer/bomber jacket with zipper (zipper dark gray) and ribbed cuffs.
- vest — 조끼 — buttoned knit vest (V-neck), no sleeves.
- raincoat — 비옷 — hooded raincoat with snap buttons (snaps dark gray), slightly glossy cel highlights.
Shoes (pairs, three-quarter view)
- dress_shoes — 구두 — oxford dress shoes with cap toe; soles dark gray.
- sneakers — 운동화 — lace-up sneakers; soles light gray.
- boots — 부츠 — mid-calf boots with low heel; soles dark gray.
- hiking_boots — 등산화 — chunky hiking boots with hooks for laces; soles dark gray with tread.
- slippers — 슬리퍼 — slide slippers; soles light gray.
- socks — 양말 — one pair of crew socks lying flat.
Head and face
- hat — 모자 — baseball cap, three-quarter view.
- glasses — 안경 — thin rectangular eyeglasses, front view, frame dark gray, empty lenses (background shows through). Not recolorable.
Neck
- tie — 넥타이 — necktie lying flat in a gentle S curve.
- muffler — 목도리 — thick knit winter scarf, loosely folded, fringe at ends.
- scarf — 스카프 — light silk square scarf, loosely folded into a soft triangle.
Hands and wrist
- gloves — 장갑 — a pair of knit winter gloves, slightly overlapping.
- ring — 반지 — one ring, slightly angled; band silver-gray, small stone. Not recolorable.
- watch — 시계 — wristwatch, strap white (recolorable), case and face gray.
Other
- bag — 가방 — backpack with two straps and a front pocket; buckles dark gray.
- earrings — 귀걸이 — a pair of small drop earrings, silver-gray. Not recolorable.

PATTERN TILES
Seamless repeating tiles, 512x512, pure black marks on pure white, flat, no shading, no outline, scale fit for a garment shown at ~70px (about 4–6 repeats across a shirt):
- stripes — 줄무늬 — even vertical stripes.
- check — 체크무늬 — simple tartan/gingham check, two line weights.
- floral — 꽃무늬 — small simple five-petal flowers, scattered.
- dots — 물방울무늬 — evenly spaced polka dots.
(민무늬 = no tile.)

POST-PROCESS (Python, Pillow + numpy; may extend scripts/clothing-game-cut-layers.py or add scripts/clothing-game-cut-icons.py)
For each item:
1. Cut the #00FF00 background to alpha (tolerance + green despill on edges), keeping the white sticker border. Holes that are truly background (inside straps, between legs of shorts, glasses lenses, ring hole) must become transparent.
2. Fabric mask: alpha mask of the recolorable fabric only (white/light-gray areas inside the item outline, excluding the white sticker border outside the black outline, black lines and the gray non-recolorable parts). If automatic extraction is unreliable for an item, produce an edited copy of the source where recolorable areas are painted pure #FF00FF and threshold it (same method as test2/icons/*_mask.png).
3. Export:
   - public/images/clothing-game/prod/icons/<id>.png — RGBA 256x256, RGB=0 where alpha=0, grayscale (except jeans).
   - public/images/clothing-game/prod/icons/<id>_fabric.png — 256x256 single-channel alpha mask (L mode), aligned pixel-perfect with the icon. Skip for non-recolorable items (jeans, ring, earrings, glasses).
   - public/images/clothing-game/prod/patterns/<id>.png — RGBA 256x256 tiles: marks white-opaque, background transparent (the app tints the marks).
   - public/images/clothing-game/prod/icons/manifest.json — array of {id, ko, slot, recolorable, patternable}. slot ∈ top, bottom, full, outer, shoes, head, neck, hands, other. patternable=true for fabric garments, socks, tie, muffler, scarf, hat, bag; true also for swimsuit; false for shoes, jeans, ring, earrings, watch, glasses.
4. Keep 1024px sources, intermediate masks, contact sheets and generation-prompts.json in content/reference/art-sources/clothing-game/icons/ and .../patterns/ — NOT in public/.

SELF-CHECK
- Contact sheet of all 35 icons at 72px on a light-gray background next to the sticker girl idle.png at the same size: same line weight, shading and sticker border, readable silhouettes, consistent scale tiers.
- Recolor test sheet: every recolorable icon tinted red (#E53935), navy (#1A237E) and black (#222222) by multiply through its fabric mask, plus one row with stripes/check/floral/dots applied inside the fabric mask. Outlines stay black, the white sticker border stays white, non-recolorable parts stay gray, no tint outside fabric, no green fringe.
- Confirm RGB=0 outside alpha, no green fringe on edges, exact 256x256 sizes.
- Report any item that failed and was regenerated.
```

---

# Промпт Codex — диалоговая игра: макеты стиля (шаг 1)

```text
Task: create STYLE MOCKUPS (not final assets) for a dialogue mini-game inside a Korean-learning web app. They will be used as a visual reference for an HTML/CSS implementation. Use the built-in image generation tool. Do not modify any app code.

SETTING
A modal window that looks like a hacker computer terminal: near-black background (#050a06), phosphor-green UI (#00ff66 bright, #0fbf4f mid, #0a5c2a dim), monospace pixel-ish font, faint CRT scanlines, subtle glow, thin 1px green frames with corner brackets, blinking block cursor. Matrix / retro-terminal vibe, clean and readable, not noisy.
Characters are shown half-body (head, neck, shoulders, arms, torso down to the hips), large, on the left or center, like a visual-novel / game dialogue. Below them a dialogue box with the speaker name tag and the line of text; Korean text must be crisp Hangul.

MAIN CHARACTER (the girl): use public/images/lesson-sticker/lesson10-girl/idle.png (1024px source: content/reference/art-sources/lesson-sticker/lesson10-girl/sources/idle.png) as the identity reference — same face, chin-length choppy bob with blunt bangs, hot magenta-pink fading to violet hair with electric-blue streaks, eyeliner, silver ear piercings. Now half-body: black cropped bomber jacket with magenta trim over a white top, holding a smartphone.

MAKE TWO STYLE VARIANTS of every screen so the user can choose:
- Variant A "hologram": characters rendered monochrome phosphor green with scanlines, like a hologram on the terminal.
- Variant B "color": characters in full color (same bold black ink outline and cel shading as the sticker), placed inside the green terminal UI.

SCREENS (16:10, 1600x1000 each, both variants = 8 images)
1. incoming — terminal boot text lines, a big blinking notification "INCOMING CALL / 수신 전화" with the girl's small avatar and a large [ START ] button, hint "press Enter".
2. call — the girl half-body holding a phone to her ear, slightly annoyed; dialogue box: name tag "지아", text "Наконец-то я до тебя дозвонилась! Ты где пропадал?"; answer button "▶ 다음".
3. shop — a male shop assistant half-body (Korean, late twenties, neat apron over a shirt, friendly), a horizontal strip of clothing cards behind him; dialogue: "어서 오세요! 천천히 구경하세요." Below: three rows of choice chips (color: 검은색 남색 회색 … / pattern: 민무늬 줄무늬 … / item: 정장 와이셔츠 구두 …) and a terminal input line "> 검은색 정장 주세요_".
4. interview-fail — in front of an office building entrance (simple line-art background), the girl half-body, angry, arms crossed; dialogue: "뭘 산 거야?! 내가 정장 사라고 했잖아!"; buttons "↺ 가게로 돌아가기".

OUTPUT
- Save to content/reference/art-sources/clothing-game/dialogue-mockups/{A,B}-{incoming,call,shop,interview-fail}.png plus a side-by-side contact sheet compare.png and generation-prompts.json.
- Nothing goes into public/.

SELF-CHECK
- Korean and Russian text is legible and spelled exactly as given.
- The girl is recognisable as the same character as the sticker in both variants.
- Report which variant looks more readable at laptop and phone sizes.
```

---

# Промпт Codex — диалоговая игра: персонажи, фон, стикер (шаг 2)

```text
Task: generate the final character art, one background and a new sticker for the dialogue mini-game (Korean-learning web app, lesson 10, "job interview" episode). Use the built-in image generation tool. Do not modify any app code.

STYLE (all characters)
- Match the FULL-COLOR characters of the approved mockups content/reference/art-sources/clothing-game/dialogue-mockups/B-call.png, B-shop.png, B-interview-fail.png: bold black ink outline with varied line weight, sharp cel shading, anime-comic proportions, same quality.
- Characters are drawn ONLY in full color. The app turns them into a green hologram with a filter for phone/online scenes, so: clear readable values (light skin and white shirt vs dark jacket), strong outline, no green anywhere on the characters, no glow, no scanlines, no UI, no text.
- Half-body: head, neck, shoulders, both arms, torso down to the hips, cut cleanly at the hips. Facing slightly toward the viewer's right (they stand at the left of a dialogue screen). Same scale, same crop height and same head position in every frame of one character, so frames can be swapped without jumping.
- Canvas 1024x1280 (portrait), solid flat #00FF00 background, no shadow, character centered horizontally, top of hair ~60px from the top, hips touching the bottom edge.

CHARACTER 1 — 지아 (the girl). Identity: content/reference/art-sources/lesson-sticker/lesson10-girl/sources/idle.png and the mockups — chin-length choppy bob with blunt bangs, hot magenta-pink fading to violet with electric-blue streaks, winged eyeliner, two silver ear studs. Outfit (changed from the mockups): black bomber jacket with magenta trim, open, over a plain white crew-neck T-shirt that covers the whole torso (not cropped, modest neckline), dark pants at the hips. A black smartphone where noted.
Generate idle first, then every other frame from it as identity reference (same face, hair, outfit, crop):
- call-annoyed — phone to her ear (right hand), eyebrows down, pouting: "finally you picked up".
- call-talk — phone to her ear, neutral talking, mouth slightly open.
- call-aside — phone to her ear, head turned over her shoulder, talking to someone behind her, other hand raised "wait a sec".
- call-smirk — phone to her ear, teasing smirk, one eyebrow raised, free hand pointing at the viewer: "don't embarrass me".
- happy — no phone, big proud grin, thumbs-up, sparkles not needed.
- angry — no phone, arms crossed, furious frown, mouth open scolding (like mockup B-interview-fail).
- facepalm — no phone, palm on her forehead, eyes closed, exasperated.
Save: content/reference/art-sources/dialogue/jia/sources/<name>.png and public/images/dialogue/jia/<name>.png.

CHARACTER 2 — 점원 (shop assistant, online clothing store, appears as a hologram). Identity from mockup B-shop.png: Korean man, late twenties, tousled dark hair, friendly face, grey button-up shirt with sleeves rolled, black apron.
- welcome — open palm gesture toward the viewer's right, warm smile (like the mockup).
- smile — hands together, polite smile.
- thinking — hand on chin, looking at something to the side, slight frown.
- bow — polite slight bow, eyes closed, smiling: "thank you".
Save: content/reference/art-sources/dialogue/clerk/sources/<name>.png and public/images/dialogue/clerk/<name>.png.

BACKGROUND
- office-entrance — the office building entrance from mockup B-interview-fail.png, WITHOUT any character: green line-art on near-black (#050a06), lines #0fbf4f / #0a5c2a, glass doors, plants, calm, low detail at the left third (character stands there), 1600x1000. Save public/images/dialogue/bg/office-entrance.webp (quality ~82) and the PNG source in content/.

NEW STICKER (button on the lesson page, white background page)
- 지아's head and shoulders in the old sticker style (thick white die-cut border ~24px, transparent background via #00FF00), wearing small black headphones with a mic, smartphone screen glowing green beside her face; a small green "incoming call" ring icon near the phone.
- Frames: idle, blink (identical, only eyes closed), hover (excited "oh?"), ringing (phone vibrating — motion lines, mouth open "hey!").
Save content/reference/art-sources/lesson-sticker/jia-call/sources/<name>.png and public/images/lesson-sticker/jia-call/<name>.png.

POST-PROCESS (Python, Pillow + numpy; may extend existing scripts)
- Remove #00FF00 to RGBA with despill, RGB=0 where alpha=0.
- Characters: export public PNG at 640x800, keep 1024x1280 sources only in content/.
- Sticker: export 256x256 like the old sticker set.
- Keep every frame of a character pixel-aligned (same crop box).

SELF-CHECK (save sheets in content/reference/art-sources/dialogue/)
- frames-jia.png / frames-clerk.png: all frames side by side — same face, hair, outfit, scale, crop; no frame jumps.
- holo-test.png: every character frame next to a hologram version (luminance → green ramp #05100a → #0fbf4f → #c0ffd0, 1-in-4 scanlines darkened 20%) on #050a06, to confirm faces and gestures stay readable in green.
- No green fringe on edges; the T-shirt covers the torso.
- generation-prompts.json with exact prompts.
```

---

# Промпт Codex — стикер jia-call: перерисовать телефон (правка)

```text
Task: fix ONLY the smartphone in the 4 sticker frames of 지아 (lesson sticker "jia-call"). Use the built-in image generation tool in edit mode. Do not modify any app code.

FILES
- Sources: content/reference/art-sources/lesson-sticker/jia-call/sources/{idle,blink,hover,ringing}.png (1024x1024 on #00FF00).
- Exports: public/images/lesson-sticker/jia-call/{idle,blink,hover,ringing}.png (256x256 RGBA).
- Before editing, copy the current sources and exports to content/reference/art-sources/lesson-sticker/jia-call/revisions/neon-phone/{sources,exports}/.

WHAT TO CHANGE (phone area only)
1. Phone screen: replace the flat neon #00FF00 fill with a dark terminal screen — near-black green #06140b, thin bright green (#00ff66) elements: a small call waveform (3–5 vertical bars) in the middle and a tiny "• • •" or "CALL" label in monospace; subtle glow on the screen edge only. Absolutely no pure #00FF00 anywhere (it is the chroma-key colour).
2. Call icon above the phone: replace the green circle with a phone handset and speech-bubble tail (looks like a messenger logo) with a NEUTRAL icon: a simple black-outlined handset with 2–3 curved "ringing" wave lines, filled dark #06140b with #00ff66 handset, no circle badge, no bubble tail, nothing resembling any brand logo.
3. In "ringing" keep the vibration/motion lines around the phone; the waveform bars may be taller there.

KEEP IDENTICAL
- Face, eyes, hair, headset, mic, ear studs, jacket, hand and fingers, the white die-cut border, framing and scale. Use a mask over the phone + icon region so nothing else changes; all 4 frames must stay pixel-aligned with each other (blink must still differ from idle only around the eyes).

POST-PROCESS
- Cut the #00FF00 background to RGBA with despill (the new screen is dark, so it will not be keyed out), RGB=0 where alpha=0, export 256x256 to public/, sources stay 1024 in content/.

SELF-CHECK
- preview.png: 4 frames on white AND on #f1ebdc (the app's paper colour) at 256px and at 96px.
- No pure or near #00FF00 pixels left inside the sticker (count them; G>200 with R,B<80 must be 0 except the antialiased bright-green screen lines).
- Diff outside the phone/icon mask = 0 for every frame; idle vs blink diff only around the eyes.
- Update generation-prompts.json with the exact edit prompt and the mask.
```

---

# Промпт Codex — манекены магазина (диалоговая игра)

```text
Task: generate two 3D store mannequins (male and female) for the online-store scene of a Korean-learning dialogue game, plus exact per-zone masks for click/hover hit-testing. Use the built-in image generation tool. Do not modify any app code.

CONTEXT
- The scene is a dark green "hacker terminal" UI. In the store the clerk and the mannequins are shown as a green hologram: the app converts colours to a green ramp with a filter (luminance → #05100a … #0fbf4f … #c0ffd0) and adds scanlines. So draw the mannequins in NEUTRAL colours with strong value contrast; no green, no glow, no scanlines, no UI, no text.
- Style reference for line/shading consistency: public/images/dialogue/clerk/welcome.webp (the clerk who stands next to them) and content/reference/art-sources/dialogue/shop-mannequins.html (layout idea: two mannequins to the right of the clerk).

THE MANNEQUINS
- NOT realistic people: smooth faceless 3D display mannequins (glossy light-grey / white plastic, subtle cel shading, bold dark outline like the clerk), visibly SEGMENTED into parts with thin seams/joints (neck ring, shoulder joints, elbow/wrist joints, waist seam, knee joints), standing on a thin metal stand with a round base.
- Pose: front view, slight A-pose — arms a little away from the torso so sleeves/arms are clearly separate from the body; legs slightly apart; feet visible.
- They wear simple, generic, slightly schematic clothing in neutral greys so each zone reads clearly (clothes are secondary, "just indicating" what goes where):
  MALE: baseball cap, thin glasses, necktie, dress shirt, open blazer (sleeves = outer layer), wristwatch on the left wrist, straight trousers, dress shoes.
  FEMALE: beret-like hat, thin glasses, small drop earrings, light scarf at the neck, blouse, open cardigan/jacket (sleeves = outer layer), knee-length skirt, ankle boots, small shoulder bag hanging at the right hip on a strap.
- Same scale, same height, same baseline and same camera for both; full body from hat to stand base.
- Canvas 1024x1536 each, solid flat #00FF00 background (chroma key), no floor shadow; the mannequin centred, top of hat ~60px from the top, stand base ~40px from the bottom.

ZONE MASKS (most important — used for hover highlight and click)
For each mannequin produce one mask PNG per zone, same size and pixel-aligned with the image: white (#FFFFFF) = zone, black = everything else, crisp edges, zones must NOT overlap and must cover the visible part fully:
- head (hat area), face (eyes/glasses band), neck (tie / scarf area), top (shirt/blouse visible on the chest), outer (both sleeves + jacket fronts), hands (wrists + hands, watch area), bottom (trousers / skirt), shoes (both shoes / boots)
- female only: ears (both earrings + earlobes), bag (bag + strap)
Derive them by editing a copy of the image where each zone is painted a distinct flat colour, then threshold; refine by hand where needed so thin parts (tie, strap, earrings, glasses) stay clickable — dilate thin zones by ~6px at 1024 so they are not too small to hit.

OUTPUT
- Sources (1024x1536, chroma background) + zone-colour edit + masks: content/reference/art-sources/dialogue/mannequins/{male,female}/...
- App files:
  public/images/dialogue/mannequins/male.webp, female.webp — RGBA (background cut with despill), 512x768, WebP quality ~85.
  public/images/dialogue/mannequins/male-zones.png, female-zones.png — ONE combined zone map per mannequin, 512x768, NO antialiasing, every zone filled with its exact index colour, transparent elsewhere:
    head #010000, face #020000, neck #030000, top #040000, outer #050000, hands #060000, bottom #070000, shoes #080000, ears #090000, bag #0A0000
  (the app reads the red channel at the cursor to know the zone; alpha 255 inside zones).
  public/images/dialogue/mannequins/zones.json — { "male": { "head": [x,y,w,h], ... }, "female": {...} } bounding boxes in 512x768 coordinates (for placing popups/labels).
- generation-prompts.json with the exact prompts.

SELF-CHECK (save sheets in content/reference/art-sources/dialogue/mannequins/)
- preview.png: both mannequins side by side next to clerk/welcome.webp at the same scale, in colour AND through the hologram ramp above on #050a06 — segmentation, clothes and zones must read clearly in green.
- zones-overlay.png: each mannequin with every zone outlined in a different colour + label; confirm no overlaps, no gaps on clothing, thin zones dilated.
- Confirm zone map pixels are exact index colours (no blended values), sizes 512x768, no green fringe on the mannequin edges.
```

---

# Промпт Codex — цветные варианты вещей (12 цветов)

```text
Task: produce ready-made coloured versions of every recolourable clothing icon of the Korean-learning app, so the app no longer recolours them in code. Use the built-in image generation tool in EDIT mode on the existing icons (no redesign). Do not modify any app code.

INPUT
- Icons: public/images/clothing-game/prod/icons/<id>.png (256x256 RGBA, white/grey fabric, black ink outline, white sticker border) and their 1024px sources in content/reference/art-sources/clothing-game/icons/sources/.
- Fabric masks: public/images/clothing-game/prod/icons/<id>_fabric.png (white + alpha = recolourable fabric).
- Items: every entry of public/images/clothing-game/prod/icons/manifest.json with "recolorable": true (31 items: dress_shirt, tshirt, blouse, pants, skirt, shorts, suit, dress, tracksuit, hiking_wear, hanbok, school_uniform, swimsuit, jacket, coat, padded_jacket, vest, raincoat, dress_shoes, sneakers, boots, hiking_boots, slippers, socks, hat, tie, muffler, scarf, gloves, watch, bag).

COLOURS (id — Korean — target fabric colour in the LIT areas)
white — 흰색 — keep as is (copy the original)
black — 검은색 — #2b2b2b
gray — 회색 — #9e9e9e
navy — 남색 — #2f4a8f
brown — 갈색 — #8a5a3b
red — 빨간색 — #e53935
orange — 주황색 — #fb8c00
yellow — 노란색 — #fdd835
green — 초록색 — #43a047
blue — 파란색 — #1e88e5
purple — 보라색 — #8e44ad
pink — 분홍색 — #f48fb1

RULES
- Same drawing, same pose, same size and position, pixel-aligned with the original icon (the app may swap them in place). Only the FABRIC changes colour — use the fabric mask to limit the edit.
- Proper shading: lit areas = the target colour, cel shadows = a darker shade of the same hue (not grey), highlights slightly lighter. Dark colours (black, navy, brown) must keep visible folds and seams — never a flat silhouette.
- Do NOT recolour: black ink outlines, the white sticker border, buttons/zippers/buckles, soles of shoes, watch case/face, metal parts, stitching drawn in black.
- No green fringe, no halo, no texture, no gradients beyond the cel style.

OUTPUT
- public/images/clothing-game/prod/colored/<id>/<color>.webp — RGBA 256x256, WebP quality ~88, RGB=0 where alpha=0, alpha identical to the original icon.
- Sources (1024px) and intermediate edits: content/reference/art-sources/clothing-game/colored/<id>/...
- generation-prompts.json with the exact prompts.

SELF-CHECK (sheets in content/reference/art-sources/clothing-game/colored/)
- colors-<id>.png for every item: 12 colours in a row at 128px on #050a06 and on #f1ebdc — same shape, correct colour names, folds visible on dark colours, details untouched.
- all-items.png: every item in red, navy and black at 72px.
- Report any item where a detail got recoloured by mistake and was fixed.
```

---

# Промпт ChatGPT — цветные варианты вещей (сетка 4×3 на одну вещь)

Как пользоваться: в одном чате отправить первое сообщение ниже с приложенной иконкой вещи (`public/images/clothing-game/prod/icons/<id>.png`). Для следующих вещей — короткое сообщение «Next item: <id>» с новой иконкой. Готовые сетки сохранять как `<id>.png` в `content/reference/art-sources/clothing-game/colored/chatgpt/` — нарезку, выравнивание по оригиналу и экспорт в `public/.../colored/<id>/<color>.webp` делает Claude скриптом.

```text
I attach a clothing icon from my game (white fabric with grey cel shading, bold black ink outline, thick white sticker border). Make ONE image that is a 4×3 grid of this SAME icon recoloured in 12 colours.

Canvas: 1536×1024, solid flat #00FF00 background everywhere outside the icons (no gradient, no shadow), thin #00FF00 gaps between cells, no text, no labels, no numbers.
Each cell: the icon centred, same size and same drawing in every cell — do not redraw, restyle, rotate or crop it.

Order (left→right, top→bottom):
row 1: white #ffffff, black #2b2b2b, gray #9e9e9e, navy #2f4a8f
row 2: brown #8a5a3b, red #e53935, orange #fb8c00, yellow #fdd835
row 3: green #43a047, blue #1e88e5, purple #8e44ad, pink #f48fb1

Recolour ONLY the fabric:
- lit areas = the target colour, shadows = a darker shade of the same hue (not grey), small highlights slightly lighter;
- dark colours (black, navy, brown) must still show folds and seams clearly;
- keep unchanged: black outlines, the white sticker border, buttons, zippers, buckles, metal parts, shoe soles, watch case/face, any part that is not fabric.
Keep the cel-shaded sticker style exactly as in the original.
```

Для следующих вещей:

```text
Next item. Same rules, same grid order and colours. Icon attached.
```

# Промпт Codex — маски узоров по крою вещи

```
Task: pattern masks for clothing icons in a Korean-learning game. Repository: korean-learning-app. Do not change app code.

Why: the app currently overlays stripes/check/flowers/dots as a flat straight grid over the whole fabric mask. It looks wrong: the pattern lands on the inside of garments (jacket lining, inside of collar, inner back of a skirt/pants opening) and stays straight on sleeves, turned or folded parts. I need, for each item+pattern pair below, a mask of pattern marks that follows the garment's cut, folds and perspective and covers only the OUTER visible face of the fabric.

Inputs per item <id>:
- content/reference/art-sources/clothing-game/colored/<id>/reference-source.png — original 1024×1024 RGBA icon (white fabric, grey cel shading, bold black outline, white sticker border);
- content/reference/art-sources/clothing-game/colored/<id>/fabric-mask-1024.png — fabric area (white = fabric);
- public/images/clothing-game/prod/icons/<id>.png — the same icon at 256×256 (final geometry).

Pairs (43):
dress_shirt: stripes, check
tshirt: stripes, dots
blouse: stripes, floral, dots
pants: stripes, check
skirt: check, floral, dots
shorts: stripes, check, floral
suit: stripes, check
dress: stripes, check, floral, dots
hanbok: floral
school_uniform: check
swimsuit: stripes, floral, dots
jacket: stripes, check
coat: check
vest: check
raincoat: dots
socks: stripes, dots
hat: check
tie: stripes, check, dots
muffler: stripes, check
scarf: check, floral, dots
bag: check

Pattern look (classic, small-scale, readable at 200 px):
- stripes: vertical along the garment's own axis (along sleeves, along the tie, along trouser legs), ~8–10 stripes across a torso, even width, stripe ≈ 1/3 of the period; pinstripe-like on suit/jacket (thinner);
- check: gingham — crossing semi-transparent bands, darker where they overlap; aligned to the garment's axis, bending with folds;
- floral: small five-petal flowers, scattered evenly, slightly varied rotation, no leaves;
- dots: small round polka dots in a staggered grid, foreshortened on surfaces that turn away.

Method (same approach as the colour variants):
1. For each pair, edit the reference-source image with the image generator: keep the illustration exactly (size, position, silhouette, folds, outlines, sticker border); fabric stays white; draw the pattern in pure black marks ONLY on the outer visible fabric. Never on: lining/inside surfaces, inside of collars and cuffs, inner openings, buttons, zips, buckles, soles, outlines, the sticker border. The pattern must follow the cut: separate pieces (sleeves, collar, lapels, pockets, waistband, folds of a skirt) have their own direction, stripes/check bend over folds and continue across seams naturally.
2. Extract the marks: pixels inside fabric-mask-1024 where the edit is clearly darker than the reference (exclude the reference's own dark lines), clean small noise, soften edges by ~1 px.
3. Export public/images/clothing-game/prod/patterns/<id>/<pattern>.png — 256×256 RGBA, RGB = white, alpha = mark coverage (0 outside marks), aligned pixel-exactly with prod/icons/<id>.png.
4. Keep the edit image, the 1024 mask and the prompt in content/reference/art-sources/clothing-game/patterns/<id>/.

Self-check (save as content/reference/art-sources/clothing-game/patterns/check-<id>.png and all-patterns.png): composite each mask on the coloured files prod/colored/<id>/{navy,red,yellow}.webp — marks light on navy/red, dark on yellow — and look at them yourself: no pattern on inner surfaces, correct direction on sleeves/legs/turned parts, no marks on outlines. Redo bad pairs. Report the list of files and anything you could not do.
```

# Промпт Codex — догенерировать цветные вещи (144 пары)

```
Task: finish the coloured clothing variants. Repository: korean-learning-app. Do not change app code.

Context: content/reference/art-sources/clothing-game/colored/<id>/edits/<color>.png + <color>.json are real image-generator edits (197 pairs) — these go into the app as is. Do NOT tint, palette-transfer or recolour anything by script: build-assets.py tinting is not wanted anymore, and no "mask palette transfer" fallback is allowed. If the generator quota runs out, stop and report what is left.

Generate the missing pairs, exactly like the existing edits (same prompt as in any edits/*.json, same references: public/images/clothing-game/prod/icons/<id>.png + <id>/edit-mask.png; square, transparent background; same illustration, only the fabric recoloured, shadows a darker shade of the same hue, dark colours keep visible folds; outlines, sticker border, soles, buckles, metal, watch case/face unchanged):

bag, boots, dress_shoes, gloves, hat, hiking_boots, muffler, scarf, slippers, sneakers, socks, tie: black gray navy brown red orange yellow green blue purple pink
raincoat: black gray navy
vest: pink
watch: gray brown orange yellow green blue purple pink

Colours: black #2b2b2b, gray #9e9e9e, navy #2f4a8f, brown #8a5a3b, red #e53935, orange #fb8c00, yellow #fdd835, green #43a047, blue #1e88e5, purple #8e44ad, pink #f48fb1.

Save each result as <id>/edits/<color>.png with a <color>.json receipt (same fields as the existing ones). Look at every result yourself and redo bad ones (redrawn shape, recoloured soles/metal, flat dark colours, green fringe). Then run:
/usr/bin/python3 content/reference/art-sources/clothing-game/colored/use-generated.py
It fits the edits to the icon frame and writes public/images/clothing-game/prod/colored/<id>/<color>.webp plus generated-sheet.png (red cells = no generator image). Report the list of generated pairs and anything left.
```
