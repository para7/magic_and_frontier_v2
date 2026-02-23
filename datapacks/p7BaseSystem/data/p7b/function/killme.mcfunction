
data merge entity @s {Silent:1b}
data merge entity @s {DeathLootTable:"minecraft:null"}
# 処理軽減のためタグ解除を仕込んでないのでプレイヤーに発動すると詰む
effect give @s[type=!player] minecraft:invisibility
tag @s[type=!player] add VoidWarp

