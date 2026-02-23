# TODO: 処理順固定のため移動する

scoreboard players set @a p7_UseSword 0
execute if entity @a[scores={p7_dealt=1..},nbt={SelectedItem:{id:"minecraft:wooden_sword"}}] run scoreboard players set @a p7_UseSword 1
execute if entity @a[scores={p7_dealt=1..},nbt={SelectedItem:{id:"minecraft:iron_sword"}}] run scoreboard players set @a p7_UseSword 1
execute if entity @a[scores={p7_dealt=1..},nbt={SelectedItem:{id:"minecraft:golden_sword"}}] run scoreboard players set @a p7_UseSword 1
execute if entity @a[scores={p7_dealt=1..},nbt={SelectedItem:{id:"minecraft:diamond_sword"}}] run scoreboard players set @a p7_UseSword 1
execute if entity @a[scores={p7_dealt=1..},nbt={SelectedItem:{id:"minecraft:netherite_sword"}}] run scoreboard players set @a p7_UseSword 1

# execute if entity @a[scores={p7_UseSword=1..}] run tell @a sword
scoreboard players set @a p7_dealt 0
