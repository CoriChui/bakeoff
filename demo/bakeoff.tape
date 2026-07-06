# VHS tape for the README demo GIF.
# Prereq: `brew install vhs` (pulls ttyd + ffmpeg).
# Render: `vhs demo/bakeoff.tape` → writes demo/bakeoff.gif.
# Edit demo/demo.sh for the content, or this file for size/theme/pacing.
# Docs: https://github.com/charmbracelet/vhs
Output demo/bakeoff.gif

Require echo

Set Shell "bash"
Set FontSize 19
Set Width 1340
Set Height 720
Set Padding 26
Set Margin 18
Set BorderRadius 10
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
Set PlaybackSpeed 1.0

# Hidden setup so the visible line looks like a real command.
Hide
Type "source demo/setup.sh" Enter
Type "clear" Enter
Show

Sleep 500ms
Type `bakeoff "8h/24h deadline: Batches vs keep-sync vs embedding-merge?"`
Sleep 600ms
Enter

# Keep recording while demo.sh renders its paced output (~10s of internal sleeps).
Sleep 12s
