# 

# 利用Rosetta进行蛋白质柔性对接



## 1. 基本原理与流程

以Local Docking为例，Rosetta将初始结构中配体与受体两者拉开一定距离后，将配体随机**旋转与平移**特定角度/距离后再逐步靠近受体形成复合物，并评价结合的稳定性。Rosetta实现Local Docking具有较高的精度，但很大程度上依赖于提供的初始结构，一般要求受配体的结合位点方向相对。并保持距离在10 $\mathrm{\AA}$ 以内。

考虑到结合过程中受配体会发生一定的柔性变化，在对接之前，分别对受配体进行relax以生成多种构象（ensemble），并以此进行对接，从而反映对接过程中的构象可变性。一般情况下，我们仅对**侧链**进行relax而保持骨架结构基本不变。

因此，Rosetta中进行蛋白-蛋白柔性对接的基本流程为：

1. 输入结构准备：受体PDB文件（`R.PDB`）、配体PDB文件（`L.PDB`）、初猜复合体结构（`complex.PDB`）
2. relax分别生成受体、配体的ensemble
3. 进行Local Docking
4. 分析结果，寻找最优结构

Rosetta子程序使用命令行调用时，为了方便，可以将输入的参数汇总在一个**flag**文件中输入

本文的例程中包括：

```
├── flag
│   ├── docking_flag
│   ├── docking_prepack_flag
│   ├── relax_flag_ChainL
│   └── relax_flag_ChainR
├── input
│   ├── R.pdb
│   ├── L.pdb
│   └── complex.pdb
└── sh
    ├── dock.sh
    └── relax.sh
```

其中：

- `flag`目录下包括输入参数（Flag）文件
- `input`目录下包括三个输入PDB结构文件
- `sh`目录包括运行脚本文件



所调用的Rosetta子程序一般位于Rosetta安装目录下的：`source/bin/`。为了方便，这里在`~/.bashrc`中加入环境变量：

```bash
export RosettaHOME=xxx/xxx/source/bin #xxx/xxx为Rosetta的安装目录
```



## 2. 输入结构准备

需要准备三个初始结构文件：

- 受体PDB文件（`R.PDB`）
- 配体PDB文件（`L.PDB`）
- 初猜的符合体结构PDB文件（`complex.PDB`），即将受体与配体的结合位点相对放置，并保持距离在10 $\mathrm{\AA}$ 以内

同时需要注意：

- 三个文件中的链名称应对应一致；即`complex.PDB`中各条链的名称与`R.PDB`， `L.PDB`中的一致
- 受体或则配体PDB文件中可以包含多条链；在`complex.PDB`中受体和配体的多条链应连续出现在一起（如配体为BC，受体为DA，则允许出现的顺序为BCDA或DABC）
- 尽量去除除蛋白分子外的其他分子，或去除对于Binding没有影响的Domain
- `complex.PDB`与`R.PDB`+`L.PDB`的总原子数、残基数保持绝对一致

## 3. Relax生成不同构象

### 3.1 参数文件准备

本例中使用的参数文件为`flag/relax_flag_ChainL`和`flag/relax_flag_ChainR`，分别用于配体、受体的relax运行

以`flag/relax_flag_ChainL`为例，文件内容如下：

```
-nstruct 35

-in:file:s ../input/L.pdb

-relax:constrain_relax_to_start_coords
-relax:ramp_constraints false

-ex1
-ex2

-use_input_sc
-flip_HNQ
-no_optH false

-relax:default_repeats 5
-out:path:pdb ./PDB_output/ChainL
-out:path:score ./score_output/ChainL
```

其中关键参数：

- `-nstruct`：生成多少个relax结构，一般大于25
- `-in:file:s`：输入的PDB文件路径
- `-relax:constrain_relax_to_start_coords`：保持骨架链不变
- `-flip_HNQ`：考虑H、N、Q三种残基环的翻转
- `-no_optH`：是否优化H（false为优化）
- `-relax:default_repeats`：每个输出结构重复relax的次数
- `-out:path:pdb`：输出PDB的路径
- `-out:path:score`：输出评分的路径

### 3.2 运行relax

进行relax的子程序名称为`relax.xxx.xxx`，如本例中为`$RosettaHOME/relax.static.linuxgccrelease`。调用时，使用`@`标签传入flag文件

这里使用自动化脚本运行两者的relax，存放于`sh/relax.sh`

```bash
# ! bin/bash
# Using "nohup sh sh/relax.sh &"

touch ./nohup.out
cat /dev/null > ./nohup.out
echo

rm -rf relax
mkdir relax

#Generate Log Files
touch relax/LOG.log

echo -e "\n ###################\n\n" >>  ./nohup.out
echo -e "\n\nStart From:" >> ./nohup.out
date >> ./nohup.out
echo -e "\n\n"  >> ./nohup.out

#####################
# Entering 'relax'
#####################
cd ./relax

rm -rf PDB_output
rm -rf score_output


mkdir PDB_output
mkdir PDB_output/ChainL
mkdir PDB_output/ChainR

mkdir score_output
mkdir score_output/ChainL
mkdir score_output/ChainR
 
#Run relax of L.PDB
$RosettaHOME/relax.static.linuxgccrelease @../flag/relax_flag_ChainL

echo -e "\n\n#############\n\nChainL Done: " >> ../nohup.out
date >> ../nohup.out
echo -e "\n\n#############\n\n" >> ../nohup.out

#Run relax of R.PDB
$RosettaHOME/relax.static.linuxgccrelease @../flag/relax_flag_ChainR


cd ../
#####################
# Exit 'relax'
#####################
echo -e "\n\nChainR Done:" >> ./nohup.out
date >> ./nohup.out

echo -e "\n\nALL THE RELAX DONE\n\n" >>  ./nohup.out
echo -e "\n\n######################\n\n" >> ./nohup.out

###########
Generate list of ensemble files
###########
#! bin/bash

cd relax/PDB_output/ChainL
rm -f ensemble.list
filelist1=""
for file in `ls`
	do
	filename=`realpath $file`
	filelist1=$filelist1"\n"$filename
	done
echo "$filelist1" > ensemble.list
cd ../../../

cd relax/PDB_output/ChainR
rm -f ensemble.list
filelist2=""
for file in `ls`
	do
	filename=`realpath $file`
	filelist2=$filelist2"\n"$filename
	done
echo "$filelist2" > ensemble.list
cd ../../../


cat ./nohup.out > relax/LOG.log
cat /dev/null > ./nohup.out

rm -rf relax/PDB_output_backup
cp -r relax/PDB_output relax/PDB_output_backup
```

运行后生成了不同结构的评分（位于`./relax/score_output`），不同relax后的PDB结构（`./relax/PDB_output`），以及`ensemble.list`文件，包含了每条链下每个relax输出结果的绝对路径。

## 4. 使用不同构象集进行Docking

### 4.1 参数文件准备

用于Local Docking的参数文件为`flag/docking_prepack_flag`和`flag/docking_prepack_flag`，分别为用于预处理（打包ensemble文件）和运行Docking

其中`flag/docking_flag`如下：

```
-in:file:s ../input/complex.pdb

-nstruct 1250

-partners D_M
-dock_pert 1 4

-ensemble1 ../relax/PDB_output/ChainR/ensemble.list
-ensemble2 ../relax/PDB_output/ChainL/ensemble.list

-ex1
-ex2aro

-out:path:all ./output
-out:suffix _ensemble_docking
```

其中关键参数：

- `-nstruct`：生成多少个Docking结构，一般大于500
- `-in:file:s`：输入的PDB文件路径
- `-partner`：指定参与对接的受体、配体的链编号；下划线`_`分割受体和配体
- `-ensemble1`和`-ensemble2`：指定输入受体、配体构象集的`ensemble.list`的路径
- `-out:path:all`：输出结果的路径

><b style="color:red">需要注意，`-partner`指定的链的顺序必须和`complex.PDB`文件中链出现的顺序一致，且与ensemble参数的声明顺序一致</b>，如：
>
>若`complex.PDB`中链出现顺序为B,C,D,A，其中B,C属于配体，则在`L.PDB`中出现的顺序也应为B,C；D,A属于受体，则在`R.PDB`中出现的顺序也应为D,A；由于BC先于DA出现，则应声明`-partner BC_DA`；且`-ensemble1`应对应于先出现的BC的`L.PDB`，`-ensemble2`对应于后出现的DA的`R.PDB`

### 4.2 运行Docking

Prepacking和Local Docking所使用的子程序分别为`docking_prepack_protocol.xxx.xxx`和`docking_protocol.xxx.xxx`，如本例中分别为`$RosettaHOME/docking_prepack_protocol.static.linuxgccrelease`和`$RosettaHOME/docking_protocol.static.linuxgccrelease`

批量运行的脚本`sh/dock.sh`如下

```bash
# ! bin/bash
# Using "nohup sh sh/dock.sh &"

touch ./nohup.out
cat /dev/null > ./nohup.out
echo

rm -rf docking
mkdir docking

#Generate Log Files
touch docking/LOG.log

echo -e "\n ###################\n\n" >>  ./nohup.out
echo -e "\n\nStart From:" >> ./nohup.out
date >> ./nohup.out
echo -e "\n\n"  >> ./nohup.out

#####################
# Entering 'docking'
#####################
cd ./docking

rm -rf output
mkdir output

#input中链出现的顺序应与ensemble1到ensemble2的顺序一致，并与-partners 声明顺序一致

$RosettaHOME/docking_prepack_protocol.static.linuxgccrelease @../flag/docking_prepack_flag

$RosettaHOME/docking_protocol.static.linuxgccrelease @../flag/docking_flag

cd ../
#####################
# Exit 'docking'
#####################
echo -e "To:" >> ./nohup.out
date >> ./nohup.out

echo -e "\n\nALL THE RELAX DONE\n\n" >>  ./nohup.out
echo -e "\n\n######################\n\n" >> ./nohup.out

cat ./nohup.out > docking/LOG.log
cat /dev/null > ./nohup.out
```

prepacking后，原始的ensemble目录下会生成`.ppk`文件；运行Docking后，其结果可在工作目录下的`./docking/output`中找到，包括生成的对接后PDB结构文件和评分文件`score_ensemble_docking.sc`

## 5. 结果分析

一般而言，总评分越小（一般为负值），对接效果越好。选取评分最小的多个PDB文件，查看其结构合理性。对于对接后的结构，可以进一步采用能量最小化等方法进行局部优化，排除不合理的原子接触。

示例脚本`sh/rank.sh` 提供了一个用于按照SCORE排序，并将前10个结果单独复制至`docking/output/top`
```bash
#!/bin/bash

cd docking/output

rm -rf top
mkdir top

#使用排名前几的结构
TopRank=10

# 创建一个临时文件来存储排名前10的信息
touch top/rank.sc
touch top/toprank.sc

# 提取排名和分数信息，排序并输出前10个到临时文件
awk 'NR > 2 {print $2, $40}' score_ensemble_docking.sc | sort -k1,1n -r -t " " > top/rank.sc
head -n $TopRank top/rank.sc> top/toprank.sc

# 读取临时文件中的文件名并复制对应的文件到top目录，并进行重命名
rank=1
while read -r score origin_filename; do
  new_filename="${rank}_${score}.pdb"
  cp "${origin_filename}.pdb" "top/${new_filename}"
  rank=$(($rank+1))
done < top/toprank.sc
```



# 附：脚本和参数文件

[RosettaDocking_demo](../../file/RosettaDocking_demo.zip)