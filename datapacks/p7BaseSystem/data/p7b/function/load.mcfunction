scoreboard objectives add p7_UseSword dummy
scoreboard objectives add p7_dealt minecraft.custom:minecraft.damage_dealt

scoreboard objectives add p7_RandMax dummy
scoreboard objectives add p7_Rand1 dummy
scoreboard objectives add p7_Rand2 dummy
scoreboard objectives add p7_Rand3 dummy
scoreboard objectives add p7_Rand4 dummy

scoreboard players set rand p7_RandMax 10000
scoreboard players set rand p7_Rand1 0
scoreboard players set rand p7_Rand2 0
scoreboard players set rand p7_Rand3 0
scoreboard players set rand p7_Rand4 0

tellraw @a [{"text":"enable datapack: para7 BaseSystem"}]

