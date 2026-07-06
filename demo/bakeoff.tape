# VHS tape for the README demo GIF.  Render with:  vhs demo/bakeoff.tape
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
Type `bakeoff "should our ingestion service be a monolith, a modular monolith, or split services?"`
Sleep 600ms
Enter

# Keep recording while demo.sh renders its paced output (~9s of internal sleeps).
Sleep 11s
