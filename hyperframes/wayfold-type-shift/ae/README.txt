WAYFOLD "TYPE SHIFT" - AFTER EFFECTS REBUILD
=============================================

What this is
  One script (Wayfold_Rebuild.jsx) that builds the 20 s Wayfold film in After Effects 2023 or newer as a
  normal, hand-editable project: 1920 x 1080, 30 fps, motion blur matched to the render.

How to run it
  1. Install the fonts first: open the "fonts" folder, double-click each Inter-*.ttf > Install.
     (Restart After Effects if it was open.) The script checks and opens this folder if any are missing.
  2. Unzip this folder anywhere. Keep Wayfold_Rebuild.jsx next to the "assets" and "fonts" folders.
  3. In After Effects: File > New > New Project, then File > Scripts > Run Script File... > Wayfold_Rebuild.jsx
  4. When it asks for the guide footage, pick wayfold-type-shift.mp4 (or Cancel to skip).
  5. Success looks like:  "Built 18 of 18 comps. ... No errors."
     If not, send the summary screenshot or the log it writes to your Desktop (Wayfold_Rebuild_log.txt).

Where things are
  00_MAIN       MAIN_Wayfold - every scene comp in time order; DIALOGUE_MARKERS null + comp markers name the beats;
                GUIDE_Render = the original render (guide layer, eye off; turn it on to compare frame by frame).
  01_SCENES     Pass A (Lisbon) frames 0-268, pass B (Alps) 269-537, then the end card:
                  S1x_Collage   postcards pop on in steps (frames 0, 2, 4, 5), then a slow push-in   (CAM_Collage)
                  S2x_Phone     postcards re-flow into the phone, it settles, then scrolls out          (GRP_Phone)
                  S3x_Prompt    the prompt types, then the 1.6x send close-up and press                (CAM_Prompt)
                  S4x_UXAudit   listing + blue note, dark checkout push + orange note, white panel + pink note
                  S9_EndCard    the glowing wordmark lands, settles and shrinks away
  03_PRECOMPS   PRE_Paper (background), PRE_Listing_x, PRE_Checkout_x, PRE_WhitePanel_x, PRE_Wordmark
  05_REFERENCE  the illustration and icon PNGs, and the guide MP4

Labels: red = controls/cameras (CTRL_, CAM_, GRP_), purple = driven by an expression, aqua = mattes,
        yellow = guides, sandstone = art.

Keys or expressions?
  Every move is KEYFRAMED. The keys were fitted to the film's own motion curves, so changing a feel means
  changing keys in the graph editor, like any animation. Expressions only do bookkeeping; each starts with a
  one-line comment saying what it does and which controls drive it:
    Typing ............ CTRL_Type > Typed (%) keys = the typing speed. The full line is the PromptText layer's text.
    Caret ............. follows the text: CTRL_Type > Caret Gap (px), Caret Lift (px). The blink = hold keys on its Opacity.
    Send button colour  CTRL_Send > Heat (%) keys (when/how fast) + Cold Colour, Hot Colour.
    Panel pushes ...... CTRL_Strips > Dark Left / Dark Right / White Right (px) keys = the strip edges (the creep, whip and settle).
    Note pills ........ each NOTE_ layer's Contents > Pill > Rectangle > Size keys = how the pill grows; its text follows
                        (NOTE_x > Text Inset (px)).
    Rings ............. PRE_Paper > CTRL_Paper > First Ring, Ring Gap, Ring Speed (0 = still).
    Confetti .......... PRE_Paper > CTRL_Confetti > Life, On Time, Drift, Size Min/Max, Orange Share, colours, Seed.
  Want plain keys instead? Select the property > Animation > Keyframe Assistant > Convert Expression to Keyframes.

How to change...
  ...when a panel pushes in:            drag the keys on S4x > CTRL_Strips > Dark Left/Dark Right (or White Right).
  ...how the panels move (the whip):    graph editor on those same keys.
  ...the typing speed:                  S3x > CTRL_Type > Typed (%) keys.
  ...the moment the button turns orange: S3x > CTRL_Send > Heat (%) keys.
  ...the camera close-up:               S3x > CAM_Prompt Position/Scale keys (after the "CUT close-up" marker).
  ...any copy:                          edit the text layer (the pills' widths are keys; widen them if the text gets longer).
  ...a postcard image:                  replace the PNG in assets/art (keep 1000 x 1000) or Alt-drag new footage onto the layer.
  ...confetti density/look:             PRE_Paper > CTRL_Confetti.

Clipping
  Mattes (alpha): phone tiles use MATTE_PhoneScreen (S2); chip 2 uses MATTE_Chip2Fade (S3, a Linear Wipe = the fade);
  in S4 the Listing uses MATTE_GridStrip, the Checkout MATTE_DarkStrip, the WhitePanel MATTE_WhiteStrip; each note's
  text uses its own pill. Masks: every illustration has a "Crop" mask (cover-fit into its box; the phone tiles' crops
  are keyed while they re-flow).

Easing fidelity
  170 animated channels, 1271 keys, every one fitted to the original's curve and checked at every frame and
  8 sub-frames per frame: worst error 1.44 % of a move (S4A blue cursor X). Motion blur: 180 deg shutter,
  -90 deg phase, 16 samples, like the render.

Known gaps / approximations
  - Verified in a strict After Effects mock (ES3, matchNames, stale handles, ease counts, expression references),
    not yet run in a real After Effects. Confidence: medium-high; if something fails, send the log.
  - Confetti is random (seeded) in AE, so squares sit in different places than the HTML render; rhythm and look match.
  - Paper gradient and end-card halo use Gradient Ramp (linear falloff instead of the CSS colour stops); the
    wordmark glow is three blurred copies approximating the CSS text-shadows; the chip fade is a Linear Wipe.
  - Text is set in the real fonts; After Effects may space Inter a hair differently from Chrome.
  - The fonts are static Regular/Medium/SemiBold/Bold instances cut from Inter's variable font (Latin set).
    Inter is SIL Open Font License 1.1 (fonts/Inter_OFL.txt).

Rebuilding the script (developers)
  The generator lives with the HTML project (ae/generator): node export_from_html.cjs && python3 build_ae.py
