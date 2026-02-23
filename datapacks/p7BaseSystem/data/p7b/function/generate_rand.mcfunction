# uuidを利用して乱数を生成
summon area_effect_cloud ~ 1 ~ {Tags:["random_uuid"]} 

execute store result score rand p7_Rand1 run data get entity @e[tag=random_uuid,limit=1] UUID[0] 1 
execute store result score rand p7_Rand2 run data get entity @e[tag=random_uuid,limit=1] UUID[1] 1 
execute store result score rand p7_Rand3 run data get entity @e[tag=random_uuid,limit=1] UUID[2] 1 
execute store result score rand p7_Rand4 run data get entity @e[tag=random_uuid,limit=1] UUID[3] 1 

scoreboard players operation rand p7_Rand1 %= rand p7_RandMax 
scoreboard players operation rand p7_Rand2 %= rand p7_RandMax 
scoreboard players operation rand p7_Rand3 %= rand p7_RandMax 
scoreboard players operation rand p7_Rand4 %= rand p7_RandMax 
kill @e[tag=random_uuid] 

# tellraw @a {"score":{"name":"rand","objective":"p7_Rand1"}} 
# tellraw @a {"score":{"name":"rand","objective":"p7_Rand2"}} 
# tellraw @a {"score":{"name":"rand","objective":"p7_Rand3"}} 
# tellraw @a {"score":{"name":"rand","objective":"p7_Rand4"}} 
