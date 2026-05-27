$files = Get-ChildItem -Path "app" -Filter "*.js" -Recurse
# We use single quotes '' for the Old values to prevent syntax errors
$map = @(
    @{Old='ðŸ"Š'; New='📊'}, @{Old='ðŸ"ˆ'; New='📈'}, @{Old='ðŸ"‰'; New='📉'}, @{Old='ðŸ"‹'; New='📋'},
    @{Old='ðŸ"'; New='📝'}, @{Old='ðŸ"'; New='🔍'}, @{Old='ðŸ""'; New='🔔'}, @{Old='ðŸ""'; New='🔕'},
    @{Old='ðŸ"·'; New='📷'}, @{Old='ðŸ"¸'; New='📸'}, @{Old='ðŸ"¹'; New='📹'}, @{Old='ðŸ"º'; New='📺'},
    @{Old='ðŸ"»'; New='📻'}, @{Old='ðŸ"¼'; New='📼'}, @{Old='ðŸ"½'; New='📽'}, @{Old='ðŸ"¾'; New='📾'},
    @{Old='ðŸŽ¯'; New='🎯'}, @{Old='ðŸŽ²'; New='🎲'}, @{Old='ðŸŽ®'; New='🎮'}, @{Old='ðŸŽ¸'; New='🎸'},
    @{Old='ðŸŽµ'; New='🎵'}, @{Old='ðŸŽ¶'; New='🎶'}, @{Old='ðŸŽ©'; New='🎩'}, @{Old='ðŸŽ¨'; New='🎨'},
    @{Old='ðŸŽ‰'; New='🎉'}, @{Old='ðŸŽŠ'; New='🎊'}, @{Old='ðŸŽ‹'; New='🎋'}, @{Old='ðŸŽ€'; New='🎀'},
    @{Old='ðŸ†'; New='🏆'}, @{Old='ðŸ…'; New='🏅'}, @{Old='ðŸ„'; New='🏄'}, @{Old='ðŸ‹'; New='🏋'},
    @{Old='ðŸ'''; New='👑'}, @{Old='ðŸ'''; New='👀'}, @{Old='ðŸ'''; New='👋'}, @{Old='ðŸ'''; New='💪'},
    @{Old='ðŸ'''; New='💬'}, @{Old='ðŸ'''; New='💭'}, @{Old='ðŸ'''; New='💰'}, @{Old='ðŸ'''; New='💳'},
    @{Old='ðŸ'''; New='💻'}, @{Old='ðŸ'''; New='💡'}, @{Old='ðŸ'''; New='💢'}, @{Old='ðŸ'''; New='💣'},
    @{Old='ðŸ'''; New='💤'}, @{Old='ðŸ'''; New='💥'}, @{Old='ðŸ'''; New='💦'}, @{Old='ðŸ'''; New='💧'},
    @{Old='ðŸ'''; New='💨'}, @{Old='ðŸ'''; New='💩'}, @{Old='ðŸ'''; New='💫'}, @{Old='ðŸ'''; New='💮'},
    @{Old='ðŸ'''; New='💯'}, @{Old='ðŸ'''; New='💱'}, @{Old='ðŸ'''; New='💲'},
    @{Old='ðŸš€'; New='🚀'}, @{Old='ðŸš'; New='🚁'}, @{Old='ðŸš‚'; New='🚂'}, @{Old='ðŸž'; New='🚃'},
    @{Old='ðŸ¤–'; New='🤖'}, @{Old='ðŸ¤—'; New='🤗'}, @{Old='ðŸ¤'''; New='🤔'}, @{Old='ðŸ¤'''; New='🤓'},
    @{Old='ðŸ¤•'; New='🤕'}, @{Old='ðŸ¤'''; New='🤒'}, @{Old='ðŸ¤'''; New='🤑'},
    @{Old='ðŸ§'; New='🧠'}, @{Old='ðŸ§±'; New='🧱'}, @{Old='ðŸ§²'; New='🧲'}, @{Old='ðŸ§³'; New='🧳'},
    @{Old='ðŸ§¤'; New='🧤'}, @{Old='ðŸ§¥'; New='🧥'}, @{Old='ðŸ§¦'; New='🧦'}, @{Old='ðŸ§§'; New='🧧'},
    @{Old='ðŸ§¨'; New='🧨'}, @{Old='ðŸ§©'; New='🧩'}, @{Old='ðŸ§ª'; New='🧪'}, @{Old='ðŸ§«'; New='🧫'},
    @{Old='ðŸ§¬'; New='🧬'}, @{Old='ðŸ§'; New='🧭'}, @{Old='ðŸ§®'; New='🧮'}, @{Old='ðŸ§¯'; New='🧯'},
    @{Old='ðŸ¦'; New='🦁'}, @{Old='ðŸ¦‚'; New='🦂'}, @{Old='ðŸ¦ƒ'; New='🦃'}, @{Old='ðŸ¦„'; New='🦄'},
    @{Old='ðŸ¼'; New='🐼'}, @{Old='ðŸ»'; New='🐻'}, @{Old='ðŸº'; New='🐺'}, @{Old='ðŸ¹'; New='🐹'},
    @{Old='âš½'; New='⚽'}, @{Old='âš¾'; New='⚾'}, @{Old='âšœ'; New='⚜'}, @{Old='âš '; New='☠'},
    @{Old='âš¡'; New='⚡'}, @{Old='âš™'; New='⚙'}, @{Old='âš—'; New='⚗'}, @{Old='âš""'; New='⚓'},
    @{Old='â†'''; New='↑'}, @{Old='â†"'; New='↓'}, @{Old='â†'''; New='←'}, @{Old='â†'''; New='→'},
    @{Old='â€"'; New='-'}, @{Old='â€™'; New="'"}, @{Old='â€œ'; New='"'}, @{Old='â€'; New='"'},
    @{Old='ï¸'; New=''}, @{Old='Â'; New=''}, @{Old='â'; New=''},
    @{Old='ðŸ"±'; New='📱'}, @{Old='ðŸ"²'; New='📲'}, @{Old='ðŸ"³'; New='📳'}, @{Old='ðŸ"´'; New='📴'},
    @{Old='ðŸ"µ'; New='📵'}, @{Old='ðŸ"¶'; New='📶'}, @{Old='ðŸ"·'; New='📷'}, @{Old='ðŸ"¸'; New='📸'},
    @{Old='ðŸ""'; New='🔐'}, @{Old='ðŸ"'''; New='🔑'}, @{Old='ðŸ"'''; New='🔒'}, @{Old='ðŸ""'; New='🔓'},
    @{Old='ðŸ"—'; New='🔗'}, @{Old='ðŸ"˜'; New='🔘'}, @{Old='ðŸ"™'; New='🔙'}, @{Old='ðŸ"š'; New='🔚'},
    @{Old='ðŸ"›'; New='🔛'}, @{Old='ðŸ"œ'; New='🔜'}, @{Old='ðŸ""'; New='🔝'}, @{Old='ðŸ"ž'; New='🔞'},
    @{Old='ðŸ¤™'; New='🤙'}, @{Old='ðŸ–•'; New='🖕'}, @{Old='ðŸ–'; New='🖒'}, @{Old='ðŸ–""'; New='🖓'},
    @{Old='ðŸ™'; New='🙏'}, @{Old='ðŸ™Œ'; New='🙌'}, @{Old='ðŸ™‹'; New='🙋'}, @{Old='ðŸ™†'; New='🙆'},
    @{Old='ðŸ€'; New='🀄'}, @{Old='ðŸƒ'; New='🃏'}, @{Old='ðŸ‚'; New='🂱'},
    @{Old='ðŸ¶'; New='🐶'}, @{Old='ðŸ±'; New='🐱'}, @{Old='ðŸ'; New='🐭'}, @{Old='ðŸ®'; New='🐮'},
    @{Old='ðŸ°'; New='🐰'}, @{Old='ðŸ²'; New='🐲'}, @{Old='ðŸ³'; New='🐳'}, @{Old='ðŸ´'; New='🐴'},
    @{Old='ðŸµ'; New='🐵'}, @{Old='ðŸ·'; New='🐷'}, @{Old='ðŸ'; New='🐸'}, @{Old='ðŸ¾'; New='🐾'},
    @{Old='ðŸŒ'; New='🌍'}, @{Old='ðŸŒŽ'; New='🌎'}, @{Old='ðŸŒ'; New='🌏'}, @{Old='ðŸŒ'''; New='🌑'},
    @{Old='ðŸŒŸ'; New='🌟'}, @{Old='ðŸŒ '; New='🌠'}, @{Old='ðŸŒ¡'; New='🌡'}, @{Old='ðŸŒ¢'; New='🌢'},
    @{Old='ðŸ…°'; New='🅰'}, @{Old='ðŸ…±'; New='🅱'}, @{Old='ðŸ†—'; New='🆗'}, @{Old='ðŸ†˜'; New='🆘'},
    @{Old='ðŸ†™'; New='🆙'}, @{Old='ðŸ†š'; New='🆚'}, @{Old='ðŸ†›'; New='🆛'}, @{Old='ðŸ†œ'; New='🆜'},
    @{Old='ðŸ·'; New='🏷'}, @{Old='ðŸ'; New='🏸'}, @{Old='ðŸ¹'; New='🏹'}, @{Old='ðŸº'; New='🏺'},
    @{Old='ðŸ »'; New='🏻'}, @{Old='ðŸ ¼'; New='🏼'}, @{Old='ðŸ ½'; New='🏽'}, @{Old='ðŸ ¾'; New='🏾'},
    @{Old='ðŸ ¿'; New='🏿'}
)
foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $newContent = $content
    foreach ($pair in $map) {
        $newContent = $newContent.Replace($pair.Old, $pair.New)
    }
    if ($newContent -ne $content) {
        Set-Content -Path $file -Value $newContent -Encoding UTF8
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "🎉 Done!" -ForegroundColor Cyan
