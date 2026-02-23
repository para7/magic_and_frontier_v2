kill @e[tag=NextKill]
execute as @e[tag=VoidWarp] run function p7b:warp

# function p7b:sword
# execute as @a[scores={p7_dealt=1..}] run function p7_:sword

function p7b:generate_rand

scoreboard players set @a p7_Login 0

