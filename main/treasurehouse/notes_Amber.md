# Using Amber & AmberTools (for beginners)


<p align="right"> ----SuperCRISPR </p>



总结了一下自己从零基础学习Amber与AmberTools的过程，大致涵盖了从建模、跑MD模拟、能量分析、轨迹分析等等最基本的操作流程。个人认为，真正困难的地方在于处理很对意外的报错，以及看出杂乱结果之中的意义和方向。初始的蛋白结构也许"千疮百孔"，调参过程令人头秃，但既然要做就得先迈出第一步吧......作为初学者，近千页的使用手册必然是不现实了，也许不求甚解，用简单的体系来进行计算，得到"一定能跑出来"的结果，才能让自己有勇气迈进此坑。



当能完全理解整个软件的工作流程时，不妨了解一下分子模拟和MD的深入原理，了解简单一行代码背后的公式，了解曾经被我们"视而不见"的参数的意义与作用......



刚开始学习MD是真的很无从下手，但是先学习软件的使用，也就拿到了一块使用的敲门砖。去一步步走下去，出现了问题，也就知道了需要什么答案，也就慢慢清楚了自己在做什么，慕然回首，才发现自己已经是坑中人了......





**（以下操作以Amber18&AmberTools18为例）**





> <p align="center">感谢杨志伟教授及其课题组成员的支持与帮助！</p>

> <p align="center"> 欢迎批评指正 </p>
> <p align="center"> 2696331468@qq.com </p>



------

# 1 Linux环境下安装Amber与AmberTools

## 1.0 前置条件：已安装C, C++, Fortran90等编译器

```
sudo apt-get install bc csh flex gfortran g++ xorg-dev \
zlib1g-dev libbz2-dev patch
```

以及其它，如

```text
tcsh make gcc gcc-gfortran gcc-c++ \
which flex bison patch bc \
libXt-devel libXext-devel \
perl perl-ExtUtils-MakeMaker util-linux wget \
bzip2 bzip2-devel zlib-devel tar
```

## 1.1 下载压缩文件

 通过官网下载文件Amber18.tar.bz2与AmberTools18.tar.bz2

## 1.2 选择合适文件夹，移动压缩文件至此并进行解压缩（例：/home/xxx）

```
cd /home/xxx
tar xvfj Amber18.tar.bz2
tar xvfj AmberTools18.tar.bz2
```

此时程序位于*/home/example/amber18*目录下

## 1.3 设置环境变量

```
export AMBERHOME=/home/xxx/amber18
```

## 1.4 进行编译前检测

```
cd $AMBERHOME
./configure gnu
```

## 1.5 自动配置shell环境（同时加入.bashrc文件中使其自动加载）

```
source /home/xxx/amber18/amber.sh
```

打开根目录下的.bashrc文件并编辑（使用vim）

```
vi ~/.bashrc
```

在其中加入

```
source /home/xxx/amber18/amber.sh
```

该文件已经定义好了*AMBERHOME*环境变量，并将*$AMBERHOME/bin/*加入了*PATH*，所以无需再做其他设定

## 1.6 安装

```
cd $AMBERHOME
make install
make test
```

### (1.6.1 MPI版本安装)

```
cd $AMBERHOME
./configure -mpi
make install
export DO_PARALLEL="mpirun -np 2" #(1)
make test
cd $AMBERHOME/AmberTools/src
./configure_openmpi
```

注意：

（1）*export DO_PARALLEL="mpirun -np 2"*中的数字可能为2/4/8，推荐分别执行测试，以决定最佳数字

```
export DO_PARALLEL="mpirun -np 2"
make test
export DO_PARALLEL="mpirun -np 4"
make test
export DO_PARALLEL="mpirun -np 8"
make test
#找出最佳参数x，再次运行
export DO_PARALLEL="mpirun -np x"
make test
```

（2）需要已经安装MPI并在PATH中包含*mpicc*与*mpif90* 

（3）最后一步可以使用

```
./configure_mpich
```

## 1.7 配置Python依赖环境

### （1）选择Python编译器

在编译时，默认自动使用*$AMBERHOME/miniconda/bin* 中的可执行python程序。若不具有，则提示安装Miniconda

（可选：选择在Amber中使用特定版本的Python程序，即使用*configure*命令时加入以下标签）

```
--with-python /path/to/python
```

查看和安装所需要的程序

```
# Via conda (recommended)
conda install --file AmberTools/src/python_requirement.txt
# Or via traditional“pip” package manager
pip install -r AmberTools/src/python_requirement.txt
```

### （2）Python package的位置

默认在*$AMBERHOME/lib/pythonX.X*  中。*amber.sh*  可以自动将该目录添加至*PATH*（*PYTHONPATH* 环境变量）

### （3）Amber下为python加入新的package

若在编译阶段默认安装Python至AmberTools中，则Python、ipython、jupyter、conda的可执行文件位于*$AMBERHOME/bin* 并分别命名为amber.python、amber.ipython等。

若使用amber.conda安装其他包至环境（如pandas），则在*$AMBERHOME/bin*目录下进行

```
amber.conda install pandas
```





# 2 蛋白建模

## 2.1 PDB文件的预处理

（1）使用文本格式打开xxxx.pdb源文件，去除如实验方法、高级结构等信息，只保留各原子坐标；去除不必要的溶剂离子

（2）对于X-ray衍射结构，其中的甲硫氨酸（Met）可能被置换为硒代甲硫氨酸（MSE）。一些常用力场不支持Se原子，因此使用在线工具可完成替换 https://www.novopro.cn/tools/mse2met.html

（3）使用pdb4amber转换，自动修正其中的不规范和冗余信息

```
pdb4amber xxxx.pdb > xxxx.amber.pdb
```

## 2.2 （可选）利用Gaussian计算配体力场

当蛋白质中含有非氨基酸的小分子配体时，由于自带的力场中可能不具有对应分子的力场信息，因此需要自己生成合适的力场文件才能完成建模。

若需要添加配体ligand的信息于体系中，则需要先生成配体的参数文件.frcmod与输出文件.lib

（1）若得到的ligand.pdb文件没有包含非极性氢，则需要加氢。此处用amber工具reduce命令。之后利用可视化工具进行检查是否合理。

```text
reduce ligand.pdb > ligand_h.pdb
```

（2）使用antechamber转化为Gaussian输入格式.gjf

```
antechamber -i ligand_h.pdb -fi pdb -o ligand.gjf -fo gcrt -pf y
```

（也可使用Gaussian自带转换工具）

（3）利用Gaussian计算ESP数据（需在计算设置中选择计算方式）

```
g16 < ligand.gjf > ligand.out
```

关于Gaussian计算ESP的部分，也可以在**附录2**中进行查看

（4）利用antechamber得到包含RESP电荷的.mol2文件

```
antechamber -i ligand.out -fi gout -c resp -o ligand_resp.mol2 -fo mol2 -pf y
```

生成力场文件.frcmod

```
parmchk -i ligand_resp.mol2 -f mol2 -o ligand.frcmod
```

（注意，有时需要手动修改.mol2文件中的分子名称，并使其与之后tleap中名称保持一致，如 XXX1 )

（5）使用tleap生成.lib文件方便之后使用（以及prmtop与inpcrd）

```
tleap
source leaprc.gaff
XXX1= loadmol2 ligand_resp.mol2 
check XXX1
loadamberparams ligand.frcmod
saveoff XXX1 ligand.lib 
saveamberparm XXX1 ligand.prmtop ligand.inpcrd
quit 
```

（建议检查.lib文件中分子名称是否为XXX1)

## 2.3 使用tleap程序进行蛋白建模

此时，工作目录下应包含:

- 处理后的蛋白结构 .amber.pdb文件
- 若蛋白中含有小分子配体，则需要 ligand.frcmod和ligand.lib文件

```
tleap

##################

##loading the ligand(optional)

source leaprc.gaff #使用GAFF力场
loadamberparams ligand.frcmod #加载小分子参数
loadoff ligand.lib #加载小分子

##加载.lib后，tleap程序中自动包含了XXX1对象，无需再次声明

#######################

source leaprc.protein.ff14SB #选用合适的蛋白立场
source leaprc.water.tip3p #选用合适的水盒体系（TIP3P），其中也包括常见离子的力场

pro = loadpdb xxx.amber.pdb #加载蛋白结构
saveAmberParm pro pro.prmtop pro.inpcrd 
#保存不含有水和溶剂的蛋白坐标与拓扑文件

#######################

solvateBox pro TIP3PBOX 20.0 #创建周期性水盒
#水力场类型为TIP3P，形状为正方体(BOX)，盒子边缘距离任何一个氨基酸的距离均大于20.0埃（2.0 nm）
##使用solvateOct创建正八面体盒子

##中和电荷
charge pro #查看体系是否带电
addions pro Na+ 0 ###根据实际情况，若为0，表示自动中和（离子类型需要正确）；若不为0，则添加该数目离子

######################

##添加溶剂离子

#根据log文件，寻找其盒子体积并计算buffer
#https://ambermd.org/tutorials/basic/tutorial8/index.php

##若为925204.317 A^3，（采用150 mM NaCl），则需添加 83.6 Na+ 83.6 Cl-
addIonsRand pro Na+ 128 Cl- 128

###保存溶剂化后的拓扑文件.prmtop，坐标文件.inpcrd与输出文件.off
saveAmberParm pro xxx.prmtop xxx.inpcrd
saveoff pro xxx.off

quit
```

# 3 分子动力学模拟

本示例中，在工作目录下创建IN目录，创建的运行脚本（.in）文件均存储于此目录下。

**3.1至3.4均创建了.in脚本以指明运行所需的参数，3.5中通过输入以上创建的脚本完成分子动力学模拟的计算**





***注意！***</u>

<u>若脚本在Windows环境下编辑，由于Windows（DOS）与Linux（Unix）的换行符存在差异，应使用如**Dos2Unix**程序进行格式转换，否则脚本无法被运行！</u>

<u>转换后建议在Linux环境下，在每个脚本的结尾处加入一空行，以保证成功运行</u>





## 3.1 预处理——最小化：排除不合理的原子接触

当初始结构复杂度高、结构粗糙、不合理接触较多时，为了防止体系在最小化优化过程中出现作用力过大而“体系爆炸”（原子运动速度即受力过大，体系能量异常过高），使用 溶液-侧链-骨架 的“逐步放开”优化法

运行后查看.out中的能量输出，若收敛于一个稳定的赋值则认为最小化可能完成，进行下一步，否则需要增加步数或排查其他的原因

### 3.1.1 对水分子与溶液离子进行最小化

创建脚本min1.in如下

```
Initial minimisation
 &cntrl
   imin=1, maxcyc=10000, ncyc=5000,
   iwrap=1, ntx=1,
   cut=8, ntb=1,
   ntr=1, restraint_wt=50, restraintmask= '!:WAT,Na+,Cl-',
 /
```

首行为任务标题，关键参数意义如下

- imin =1即对静态结构运行最小化（ntx=1 表示输入不包含速度的.inpcrd坐标）
- maxcyc 运行的最大循环数
- ncyc 前ncyc步使用最速下降法，之后采用共轭梯度法
- ntr 每ntr步输出一次结果至.mdout文件中
- cut 截断距离。认为仅cut（埃）距离内的原子间产生非键相互作用。该值越大越精确，但计算成本大大提高
- restrain_wt 对标记原子的限制权重（数字越大，标记原子的运动越“难”，从而起到限制作用）
- restraintmask 标记需要被约束的原子（此处标记了除了水与溶液离子外的所有原子，且权重很大，认为该过程最小化溶液体系而将蛋白整体固定）

### 3.1.2 氨基酸侧链最小化

创建脚本min2.in

```
Initial minimisation
 &cntrl
   imin=1, maxcyc=10000, ncyc=5000,
   iwrap=1, ntx=1,
   cut=8, ntb=1,
   ntr=1, restraint_wt=20, restraintmask= '@CA',
 /
```

保持每个氨基酸Ca原子位置不变，仅优化侧链位置

### 3.1.3 对整个体系的最小化

创建脚本min3.in

```
Initial minimisation
 &cntrl
   imin=1, maxcyc=10000, ncyc=5000,
   iwrap=1,
   cut=8, ntb=1,
   ntr=0,
 /
```

## 3.2 升温

模拟升温过程，使原子克服体系势垒而突破局部最小值。此为从“静态”结构转向“动态”模拟的关键阶段

**所有脚本请根据体系实际情况合理选择限制权重与限制原子**

创建脚本heat.in

```
Heating
 &cntrl
  imin=0,
  iwrap=1,
  irest=0, ntx=1,
  cut=8, ntb=1,
  ntr=1, restraint_wt=5, restraintmask= '@CA,N,C',
  ntc=2, ntf=2,
  tempi=0.0, temp0=310.0,
  ntt=3, gamma_ln=1.0, ig=-1,
  nstlim=50000, dt=0.002
/
```

- imin =0即运行分子动力学
- ntb =1即使用**等容**的周期性边界
- ntt =3即使用Langevin恒温器控制温度
- gamma_ln Langevin恒温器的碰撞频率
- tempi 初始温度（K）
- temp0 最终维持温度（K）
- nstlim 运行MD循环数
- dt 每一步的时间步长（ps）

## 3.3 体系的平衡过程

### 3.3.1 NVT系综下的平衡

创建脚本nvt.in

```
NVT
 &cntrl
  imin=0,
  iwrap=1,
  irest=0, ntx=1,
  cut=8, ntb=1,
  ntr=1, restraint_wt=2, restraintmask= '@CA,C,N',
  ntc=2, ntf=2,
  temp0=310.0,
  ntt=3, gamma_ln=1.0, ig=-1,
  nstlim=130000, dt=0.002,
  ntpr=5000, ntwx=5000, ntwr=5000
 /
```

### 3.3.2 NPT系综下的平衡

创建脚本npt.in

```
NPT
 &cntrl
  imin=0,
  iwrap=1,
  irest=1, ntx=5,
  cut=8, ntb=2,
  ntp=1, pres0=1.0, taup=2,
  ntr=1, restraint_wt=2, restraintmask= '@CA,N,C', 
  ntc=2, ntf=2,
  temp0=310.0,
  ntt=3, gamma_ln=1.0, ig=-1,
  nstlim=70000000, dt=0.002,
  ntpr=5000, ntwx=5000, ntwr=5000
 /
```

- ntp =1即使用**等压**作为周期性边界限制条件，使用Berendsen恒压器
- pres0 体系目标达到的稳定压力值

## 3.4 进行最终MD模拟

此时体系已经达到了一个接近“真实条件”的较为合理的状态，现在可以进行最终的MD模拟

创建脚本md.in

```
MD
 &cntrl
  imin=0,
  iwrap=1,
  irest=1,ntx=5,
  cut=8, ntb=2,
  ntp=1, pres0=1.0,taup=2,
  ntc=2, ntf=2,
  temp0=310.0,
  ntt=3, gamma_ln=1.0, ig=-1,
  nstlim=50000000, dt=0.002,
  ntpr=5000, ntwx=5000, ntwr=5000,
 /
```

注意，MD运行模拟的总时间（nstlim*dt）应足够长，应足够长的时间（10-1000ns）使分子发生构象变化，并保证分子真正达到平衡且稳定的状态。当然，这也意味着更长的计算时间！越大的分子需要越长的模拟时间

一般通过修改运行次数来控制模拟时间。dt=0.002适用于大多数情况，若过大则造成精度的下降。对于结构难以稳定或是有较大作用力的体系可以适当减小dt的值，以免“碰撞”与“速度溢出”。但过小的dt增加系统弛豫时间，降低对相空间的搜索能力。

## 3.5 分子动力学程序的运行

Amber提供两套功能完全一致的MD运行程序：**sander**与**pmemd**，使用方法完全一样。pmemd实质为sander的付费版，计算时间远远小于sander。以下以pmemd为例进行介绍

### 3.5.1 使用Shell脚本运行

工作目录下应包括输入文件（初始结构）xxx.prmtop 与 xxx.inpcrd

所有输入脚本（*.in）均保存于工作目录的 IN 目录下

建立脚本md.sh于工作目录

```
#!/bin/bash
pmemd -O -i ./IN/min1.in -p xxx.prmtop -c xxx.inpcrd -ref xxx.inpcrd -x min1.crd -o min1.out -r min1.rst;
pmemd -O -i ./IN/min2.in -p xxx.prmtop -c min1.rst -ref min1.rst -x min2.crd -o min2.out -r min2.rst;
pmemd -O -i ./IN/min3.in -p xxx.prmtop -c min2.rst -x min3.crd -o min3.out -r min3.rst;
pmemd -O -i ./IN/heat.in -p xxx.prmtop -c min3.rst -ref min3.rst -x heat.crd -o heat.out -r heat.rst;
pmemd -O -i ./IN/nvt.in -p xxx.prmtop -c heat.rst -ref heat.rst -x nvt.crd -o nvt.out -r nvt.rst;
pmemd -O -i ./IN/npt.in -p xxx.prmtop -c nvt.rst -ref nvt.rst -x npt.crd -o npt.out -r npt.rst;
pmemd -O -i ./IN/md.in -p xxx.prmtop -c npt.rst -x md.nc -r md.rst -o md.out -inf md.info;
```

- #!/bin/bash为Shell执行脚本所必须
- -O 覆盖已有的同名称输出文件
- -i 选择输入**脚本文件.in**
- -p 输入的**拓扑文件.prmtop**（由于拓扑文件记录原子信息与成键，因此在MD中不改变，故始终使用最初的拓扑文件）
- -c 输入的坐标文件，文件类型可以为**原子坐标(.inpcrd)**、原子轨迹(.crd)以及重启文件(.rst)
- -x 输出的**轨迹文件.crd**（即原子在每一帧的位置）。注意运行过程中每隔ntpr次循环输出一帧
- -o 输出**输出文件.out**，包含体系能量等状态信息。查看.out中的能量变化以便判断每一步骤是否出现问题
- -r 输出**重启文件.rst**，包含末帧原子坐标与速度
- -inf 输出MD信息文件，可以用来查看运行状态与**预计剩余时间**
- 若在每一行尾添加 & ，则该行命令以后台运行

在工作目录下运行该脚本

```
bash md.sh
```

**注：最后一步输出的轨迹文件为.nc类型。该类型文件被Amber支持，且通用性更高，占用空间更小，读取速度更快**

### 3.5.2 显卡加速(CUDA)版本的Shell脚本

首先，在控制台中查看空闲GPU序号

```
nvidia-smi
```

本例中，若空闲可用显卡序号为1

创建md_cuda.sh脚本。需要使用pmemd.cuda版本

```
#!/bin/bash
export CUDA_VISIBLE_DEVICES=1; #使用的显卡序号
pmemd.cuda -O -i ./IN/min1.in -p xxx.prmtop -c xxx.inpcrd -ref xxx.inpcrd -x min1.crd -o min1.out -r min1.rst;
pmemd.cuda -O -i ./IN/min2.in -p xxx.prmtop -c min1.rst -ref min1.rst -x min2.crd -o min2.out -r min2.rst;
pmemd.cuda -O -i ./IN/min3.in -p xxx.prmtop -c min2.rst -x min3.crd -o min3.out -r min3.rst;
pmemd.cuda -O -i ./IN/heat.in -p xxx.prmtop -c min3.rst -ref min3.rst -x heat.crd -o heat.out -r heat.rst;
pmemd.cuda -O -i ./IN/nvt.in -p xxx.prmtop -c heat.rst -ref heat.rst -x nvt.crd -o nvt.out -r nvt.rst;
pmemd.cuda -O -i ./IN/npt.in -p xxx.prmtop -c nvt.rst -ref nvt.rst -x npt.crd -o npt.out -r npt.rst;
pmemd.cuda -O -i ./IN/md.in -p xxx.prmtop -c npt.rst -x md.nc -r md.rst -o md.out -inf md.info;
```

工作目录下执行脚本

```
bash md_cuda.sh
```

## 3.6 初步检查运行结果

### 3.6.1 保存并查看末帧PDB结构

创建CheckStruc。使用**ambpdb**工具，将最小化、升温与最终MD模拟结果的最后一帧的原子坐标转换为PDB文件

```
mkdir CheckStruc
ambpdb -p pr_sol.prmtop -c min3.rst > CheckStruc/min3.pdb
ambpdb -p pr_sol.prmtop -c heat.rst > CheckStruc/heat.pdb
ambpdb -p pr_sol.prmtop -c md.nc > CheckStruc/md.pdb
```

使用Chimera、Pymol结构即可打开查看

### 3.6.2 使用VMD软件查看动态结构

在VMD中，加载轨迹文件与拓扑文件，即可查看模拟过程中蛋白结构的动态变化过程。

VMD中操作流程如下

1. File -> New Molecula创建新的分子
2. 加载拓扑文件md.prmtop，文件类型为AMBER7.parm。成功后出现0:prmtop对象
3. 加载轨迹文件md.nc至0:prmtop，文件类型为NetCDF。
4. 点击Load即可加载分子。在Graphics -> Representations中可以隐藏水、离子。

### 3.6.3 初步分析体系状态的变化

使用AmberTools自带的**mdout_analyzer.py**程序可以完成对总能量、动能、温度等数据的分析与提取

```
mdout_analyzer.py <mdout1> <mdout2> <mdout3> ... <mdoutN>
```

输入的文件.out将按顺序被合并，最终产出合并后的分析结果。具有GUI界面，但依赖numpy和matplotlib包



也可使用***process_mdout.perl***脚本处理

```
process_mdout.perl <md1.out> <md2.out> ... <mdn.out>
```

输出温度.TEMP、密度.DENSITY、总能量.ETOT、总动能EKTOT、总势能EPTOT



**若无法直接用命令行打开该程序，则需要输入 $AMBERHOME/bin/process_mdout.perl 调用程序**



使用Xmgrace可以进行绘图

```
xmgrace summary.ETOT summary.EPTOT summary.EKTOT
```



根据不同阶段能量等性质的变化，初步判断MD模拟的质量

# 4 轨迹分析

## 4.1 基于cpptraj进行分析

cpptraj是在MD结果分析中极其重要的一个工具（AmberTools自带），是轨迹提取、拓扑文件处理以及简单轨迹分析计算中最为常用（也是最好用）的工具

### 4.1.1 溶剂分子的去除、RMSD与RMSF的计算

命令行中打开cpptraj程序

```
cpptraj
```

在cpptraj中执行以下操作

```
#

##去溶剂，仅保留蛋白分子
parm xxx.prmtop	#首先需要读入拓扑文件
trajin xxx.nc	#读入轨迹文件
strip :WAT,Na+,Cl- parmout no_solv.prmtop	#从体系中去除（strip）水分子与溶剂离子；同时输出去除以上原子后的拓扑文件no_solv.prmtop

##计算RMSD
center :50-322 	#使蛋白分子的50-322残基位于盒子中心位置
autoimage origin	
#以第一帧为参考计算RMSD
rms first mass out rmsd_1.dat (@CA)	#计算RMSD；first代表以第一帧为参考fit；输出rmsd_1.dat；仅计算Ca原子的波动；质量加权
run

#以平均结构为参考的RMSD
average crdset AVG	#求平均结构并保存与AVG数据集中
run

rms ref AVG mass out rmsd_avg.dat (@CA)
run

#输出去水、中心化后的轨迹文件
trajout no_solv.nc

run
```



为方便操作，可以将以上操作保存为脚本strip_rmsd.in。在命令行调用cpptraj时输入

```
cpptraj -i strip_rmsd.in
```



将得到的数据可以直接用xmgrace绘制

```
xmgrace rmsd_avg.dat
```



以下脚本rmsf.in可以计算RMSF，输出rmsf.dat

```
#
parm no_solv.prmtop
trajin no_solv.nc
atomicfluct byres out rmsf.dat start 1 stop last

#byres/byatom 按照氨基酸残基（自动质量加权）/原子为单位计算RMSF
#start与stop指明计算范围。默认（缺省值）代表全部（1/last）

run
```



### 4.1.2 输出指定范围内的平均结构

选取RMSD较为平稳的一段（如7501-10000帧），利用以下脚本average.in输入至cpptraj中，得到平均结构的pdb文件

```
#
parm no_solv.prmtop
trajin no_solv.mdcrd 7501 10000 #读取7501-10000帧
rms first @CA
average average.pdb pdb
run
```



### 4.1.3 PCA的计算

#### 获取各帧在PC1、PC2的投影

输入脚本pca.in如下，得到project.dat

```
# Step one. Generate average structure.
# RMS-Fit to first frame to remove global translation/rotation.
parm no_solv.prmtop
trajin no_solv.nc 7500 10000  #选取平稳段
trajout steady_out.nc
rms first @CA
#save average structure to dataset AVG
average crdset AVG
run

# Step two. RMS-Fit to average structure. Calculate covariance matrix.
# Save the fit coordinates.
rms ref AVG @CA
matrix covar name CovarMatrix @CA
createcrd CRD1
run

# Step three. Diagonalize matrix.
runanalysis diagmatrix CovarMatrix vecs 2 name Top2Evecs

# Step four. Project saved fit coordinates along eigenvectors 1 and 2
crdaction CRD1 projection evecs Top2Evecs @CA out project.dat beg 1 end 2

##得到的结果为各帧在PC1、PC2的投影，单位为A。将单位转化为nm后，将格式修改为.xvg即可使用ddtpd进行绘图分析
```

#### 对结果进行可视化处理

使用ddtpd(引用自http://sobereva.com/73)进行可视化



[下载链接在此](../../file/Amber/ddtpd.zip)

注意：具体使用方法见README.txt文件；请正确引用原作者Sobereva的成果！

##### 数据类型预处理

由于该程序基于Gromacs的分析结果，需要先对project.dat文件进行格式的转化，并且将其中数据格式由埃转为nm

（这里使用了R进行处理，代码如下）

```R
#convert project.dat from AMBER result .dat to .xvg for ddtpd analyse

setwd("./data/MDdata/PCA")  #修改为工作目录
getwd()
project<-read.table("project.dat")  #该文件需要位于工作目录中
colnames(project)<-c('FRAME','PC1','PC2')

#Convert A to nm
project$PC1 <- (0.1*project$PC1)
project$PC2 <- (0.1*project$PC2)


save(project,file="Project_Frame_nm.RData")
write.table(cbind(project$PC1,project$PC2),file="Project.xvg",row.names = F,col.name = F)
```

输出后结果为Project.xvg。工作区保存为Project_Frame_nm.RData

##### 利用ddtpd绘制自由能面图(Free energy landscape)

将Project.xvg拷贝至ddtpd.exe的工作目录下（应包含ddtpd.f90文件）。

执行ddtpd.exe，执行以下命令

```
Project.xvg  //文件名
100  //将X轴划分的格子数
100  //将Y轴划分的格子数
2  //选择输出方式。2代表输出-LnP
y  //令P=0的点也输出。此时数据被输出到当前目录的result.txt下。由于没有数据点分布的区域P=0，没法求对数，对这样的区域ddtpd认为其P是一个很小的常数，自由能直接设为-Ln0.000001。
y  //把-LnP最负的值，此处为-0.821262设为自由能的零点。我们感兴趣的只是相对值，所以可以加减任意常数，这样所有值加上0.821262之后数据最小值就是0，设定色彩刻度会比较方便。此时数据将输出到当前目录的result2.txt下，前两列是PC1和PC2的坐标，第三列是-LnP的值。
```

（注：根据Boltzmann分布计算自由能，如下：）
$$
G\left(x\right)=-k_B\ T\cdot\ln{P\left(x\right)}+C \\
\ln{P\left(x\right)}=\frac{N\left(x\right)}{N_{max}}\
$$
G(x), P(x), N(x), Nmax分别为自由能、构象x出现概率、构象x出现次数与所有构象中的最大出现次数。kB为Boltzmann常数，T为温度（K），C为常数。由于仅比较相对能量，可以认为C=0，或使G(x)min=0.

##### 对自由面图结果进行可视化

同样，这里使用了R完成此步骤

```R
setwd("./data/MDdata/PCA")  #修改为工作目录
getwd()
result<-read.table("result.txt") #也可选用result2.txt，根据实际情况
colnames(result)<-c('PC1','PC2','Energy')


result$Energy <- (result$Energy*0.6158274) #将单位由kT转化为kcal/mol
save(result,file='result.RData')

library("scatterplot3d")

#采用RColorBrewer中的调色板
library("RColorBrewer")
display.brewer.all()
cl <- colorRampPalette(rev(brewer.pal(11,'Spectral')))(32)
scales::show_col(cl)

#或手动设置色阶
cl <- c("#9E0142","#F99254","#FEE695","#FEFAB6","#FFFFFF")
scales::show_col(cl)


plot<-ggplot(result,aes(x=PC1,y=PC2,zEnergy))+
  geom_raster(aes(fill=Energy), interpolate = F)+ #T=模糊
  scale_fill_gradientn(colours=cl)

plot

png(filename = "result.png", width = 1300, height = 1000, res = 200)
plot
print(plot)
dev.off()
```

图像result.png保存于工作目录下

## 4.2 基于R语言中Bio3d包进行分析

### 4.2.1 使用cpptraj提取所有Ca轨迹

在进行RMSD、RMSF与PCA等分析时，由于主要只需要用到各个氨基酸Ca的轨迹，为了减少数据量，先行使用cpptraj提取Ca轨迹

输入脚本ca.in如下

```
parm xxx.prmtop	
trajin xxx.nc	
strip !@CA parmout CA.prmtop	
trajout CA.nc
```

得到CA.nc与CA.prmtop

### 4.2.2 使用Bio3d包进行各项分析

```R
library("bio3d")
library("ncdf4")


setwd("./data/MDdata/bio3d")  #修改为工作目录
traj<-read.ncdf("CA.nc")
pdb<-read.pdb("CA.pdb")

print(traj)

#返回一个对象 ca.inds，为一个包含对应于原子名称和坐标的 index 的列表。
ca.inds <- atom.select(pdb, elety="CA")
#叠加坐标,叠加之后 (叠加到 pdb 结构上) 将新的坐标保存在矩阵对象 xyz 中。
xyz <- fit.xyz(fixed=pdb$xyz, mobile=traj, fixed.inds=ca.inds$xyz, mobile.inds=ca.inds$xyz)

#从叠加之后的轨迹获取平均结构
pos_ave <- apply(xyz,2,mean)

#RMSD
RMSD<-rmsd(xyz[1,ca.inds$xyz], xyz[,ca.inds$xyz])
#绘制折线图
png(filename = "Result/RMSD.png",width = 5000,height = 3000, res = 400)
plot(RMSD, typ="l", ylab="RMSD", xlab="Frame No.")+
points(lowess(RMSD), typ="l", col="red", lty=2, lwd=2)
dev.off()
#绘制分布
png(filename = "Result/RMSDhist.png",width = 5000,height = 3000, res = 400)
hist(RMSD, breaks=40, freq=FALSE, main="RMSD Histogram", xlab="RMSD")
lines(density(RMSD), col="gray", lwd=3)
dev.off()

summary(RMSD)

#RMSF
RMSF <- rmsf(xyz[,ca.inds$xyz])
png(filename = "Result/RMSF.png",width = 5000,height = 3000, res = 400)
plot(RMSF, ylab="RMSF", xlab="Residue Position", typ="l")
dev.off()

summary(RMSF)
which.max(RMSF)
which(RMSF>1.5) #查看RMSF高于1.5的残基

#Principal Component Analysis
pc <- pca.xyz(xyz[,ca.inds$xyz])
png(filename = "Result/PCA.png",width = 5000,height = 3000, res = 400)
print(pc)
plot(pc, col=bwr.colors(nrow(xyz)) )
dev.off()
#Clustering of PCA
#hc <- hclust(dist(pc$z[,1:2]))
#grps <- cutree(hc, k=2)
#plot(pc, col=grps)
#绘制不同残基对PC的贡献
png(filename = "Result/PCAcontribution.png",width = 5000,height = 3000, res = 400)
plot.bio3d(pc$au[,1], ylab="PC1 (A)", xlab="Residue Position", typ="l")
points(pc$au[,2], typ="l", col="blue")
dev.off()
#将运动轨迹存为PDB
pc1_pdb <- mktrj.pca(pc, pc=1, b=pc$au[,1], file="Result/PDB/pc1.pdb")
pc2_pdb <- mktrj.pca(pc, pc=2, b=pc$au[,2], file="Result/PDB/pc2.pdb")
#将轨迹存为NetCDF，通过 vmd 进行查看 (display as tube representation)
write.ncdf(pc1_pdb, "Result/nc/pc1.nc")
write.ncdf(pc2_pdb, "Result/nc/pc2.nc")

#DCCM
cij<-dccm(xyz[,ca.inds$xyz])
png(filename = "Result/DCCM.png",width = 5000,height = 5000, res = 600)
plot(cij)
dev.off()

```

#在Result目录下，包含了

- **RMSD.png** RMSD折线图
- **RMSDhist.png** RMSD分布图
- **RMSF.png** RMSF折线图
- **PCA.png** PCA结果
- **PCAcontribution.png** 各残基对于PC1PC2的贡献
- **DCCM.png** Dynamical Cross-Correlation Matrix
- 以及以PDB与NerCDF格式展现的运动模式（on PC1 and PC2）

# 5 能量分析

对MD结果的能量分析中，最常用的是对结合自由能的计算。这里展示使用MM-GB/PBSA方法分析蛋白-小分子结合能，并计算出蛋白质各残基对结合能的贡献。

## 5.1 对轨迹进行预处理

利用cpptraj，从蛋白-配体复合体的.prmtop中分别提取出蛋白分子的.prmtop与配体分子的.prmtop文件

（4.1.1中演示了利用cpptraj从已有拓扑文件、轨迹文件中去除特定原子的过程。将原子标签改为对应配体/蛋白的名称或序号即可。标记原子/残基的具体方法见下文附录）

## 5.2 指定输入参数

创建脚本mmgbsa.in

```text
&general
   startframe=1, endframe=5000, interval=50,     # 从1帧开始到5000帧结束，每隔50帧取一帧计算。
   keep_files=0, debug_printlevel=2,
   netcdf=1, #使用NetCDF进行数据中间存储，提高速度
/
&gb
   igb=2, #igb可以取1,2,5,7,8，实际中可以均进行尝试选取最合理的结果。进行对照时，保证igb值相同才具有比较意义
   saltcon=0.1, #离子强度(M)
/
&decomp     # 计算分解自由能
   idecomp=2, 
   print_res='1-100; 150-300', csv_format=0, 
   dec_verbose=3,
/
```

MM/PBSA现在较为少用。具体用法和涉及到的参数含义建议查阅一下Amber使用手册

## 5.3 运行 MMPBSA.py

这里使用了MPI（并行）模式运行，将计算提交到多个平行节点上，以减少运算时间

```
mpirun -np 16 MMPBSA.py -O -i mmgbsa.in -cp ES.prmtop -rp E.prmtop -lp S.prmtop -y ES.nc -o MMPBSA_result.dat -do DECOMP_result.dat
```

- -i 输入脚本
- -cp 蛋白+配体复合物的拓扑文件
- -rp 蛋白的拓扑文件
- -lp 配体的拓扑文件
- -y 输入的轨迹文件
- -o 输出的能量结果
- -do 氨基酸分解的输出结果

（不使用MPI则命令如下）

```
MMPBSA.py -O -i mmgbsa.in -cp ES.prmtop -rp E.prmtop -lp S.prmtop -y ES.nc -o MMPBSA_result.dat -do DECOMP_result.dat
```



# 附录1 Amber程序中原子标记总结

## 目标原子的指定

- **:** 指定<u>残基</u>（或小分子）的编号或名称（在输入tleap中的pdb文件可以查到）

- **@** 指定<u>原子</u>编号或名称（pdb中的Atom Name）

- **@%** 指定<u>原子类型</u>（pdb中的Atom Type）

如，**:100-150**为第100到150号残基，**:WAT**为所有水分子，**@CA**为所有Ca原子

## 逻辑关系符号

### 复合运算

- **&** 与关系
- **|** 或关系
- **!** 否关系
- **()** 优先级

如

- **!(:ASP|!@CA)** 等价于(!:ASP)&@CA，即除了ASP残基外的所有Ca原子

### 距离声明

- **<:** 距离符号前原子/残基xx埃范围内的残基
- **>:** 距离符号前原子/残基xx埃范围外的残基
- **<@** 距离符号前原子/残基xx埃范围内的原子
- **>@** 距离符号前原子/残基xx埃范围外的原子

如

- (:211<@10)&@H 距离211号残基10埃内的所有H原子

### 通配符

- **\*** 代表“所有”
- **=** 可用于对名称中一个字母的代替（不可用于首位）

如

- **:\*** 所有残基
- **@\*** 所有原子
- **@%C\*** 所有C原子的原子类型
- **:T=R** 首字母为T、末字母为R的残基（即TYR与THR）
- **@O&@O=@O==** 以O开头的原子名称，包括2、3个字（一般即包括所有O原子）
- **@H=** 所有H原子





# 附录2 Linux下利用Gaussian计算分子ESP

在实际计算中，QM部分的参数往往需要自己根据分子特点、算力和预期精度进行选取，具有很大的灵活性，因此在这里简述一下运用Gaussian计算ESP的过程。此外也简要介绍例如ESP作图、chk格式转化等问题

Gaussian中涉及的计算化学知识，可以参考附录4中资料：Exploring Chemistry with Electronic Structure Methods

## Gaussian环境配置

在~/.bashrc中加入：

```
export g16root=~/g09  #此处应使用Gaussian实际安装目录
export GAUSS_SCRDIR=$g09root/scratch
export PATH=$PATH:$g09root/g09
source $g09root/g09/bsd/g09.profile
```

Gaussian16与Gaussian09几乎相同，仅仅将g09改为g16即可

## 对分子进行结构优化

在linux中，计算所需参数主要在.gjf输入文件中声明。

如示例input.gjf （原子坐标仅用作示例，无实际意义）

```
%lindaworker=cu03
%nprocshared=16
%mem=4GW
%chk=output1.chk
# opt=readopt freq b3lyp/6-31g

fopt_1

0 1
 C                 -4.04700000    0.11100000   -0.96700000
 C                 -3.64400000    0.92100000   -2.02300000
 C                 -4.43200000    1.02800000   -3.16100000
 C                 -5.63000000    0.33100000   -3.26400000
 C                 -6.03100000   -0.48300000   -2.20200000
 C                 -5.24400000   -0.59100000   -1.06300000
 N                 -3.27000000    0.00300000    0.15000000
 C                 -2.90900000    1.12000000    0.85300000
 C                 -2.82000000   -1.22200000    0.54700000
 C                 -1.99200000   -1.96400000   -0.28600000
 C                 -1.42900000   -3.15000000    0.16600000
 C                 -1.67100000   -3.62200000    1.44400000
 
 notatoms=N,2,10
```

其中，

- chk 指明chk文件的输出路径

- opt 声明计算类型为结构优化；freq声明进行频率计算；b3lyp/6-31g声明计算所用的理论以及基组大小。优化不推荐使用过大的基组，但单点能计算中可以适当选用大基组与弥散/极化函数增加准确性

  =readopt是**<u>可选的</u>**，作用是根据坐标矩阵后的notatoms=[要固定的原子]参数，保证特定原子在优化过程中保持不动

- fopt_N3 声明任务标题

- 0 1 指明电荷为0；自旋态为单线态

- notatoms=N,2,10 决定opt=readopt固定哪些原子。此例中，所有N原子与原子标签为2、10的原子被固定



提交任务：

```
g09 < input.gjf >out.log
```

工作目录下需要有input.gjf，输出out.log与output1.chk文件



## 将.chk（Linux）转换为.fchk（Windows）

.chk文件无法在Windows中被打开，也无法被Windows下的Gaussian/GaussView所识别。因此可以采用：

```
formchk output1.chk output1.fchk
```

（如果formchk命令无法直接执行，可以试试调用：Gaussian实际目录/formchk）

## 进行单点能计算

推荐在Windows下，使用GaussView打开.fchk，再保存为.gjf文件，并进行必要的修改

输入input2.gjf

```
%lindaworker=cu11
%nprocshared=16
%mem=4GW
%chk=output2.chk
# hf/6-311+g(2d,p) iop(6/33=2,6/42=6,6/50=1) pop=mk

ESP_1

0 1
 C                 -7.88174800   -1.13544700    0.40166400
 C                 -8.94000200   -1.64836100   -0.37482900
 C                 -9.70218000   -2.71757100    0.08427900
 C                 -9.41202400   -3.31029400    1.32294000
 C                 -8.35847100   -2.81611900    2.10232600
 C                 -7.60858300   -1.72655000    1.64418300
 N                 -7.11324300   -0.02071700   -0.06801200
 C                 -7.80353800    1.11181800   -0.61282000
 C                 -5.69757000   -0.03898900   -0.00832800
 C                 -4.98135800   -1.24748000   -0.13898500
 C                 -3.59064100   -1.25799500   -0.08716400
 C                 -2.85132200   -0.07044900    0.09107800
```

- \# 后不声明opt或freq，即为单点能计算。若计算ESP并将.log结果作为antechamber的输入文件，从而产生包含RESP信息的mol2文件，则必须使用HF方法计算。iop(6/33=2,6/42=6,6/50=1) pop=mk则是对ESP计算的声明。

提交

```
g09 < input2.gjf >out2.log
```

## 使用antechamber拟合RESP电荷

```
antechamber -i out2.log -fi gout -o out2.mol2-fo mol2 -c resp -nc -1 -pf y
```

其中，**-c resp**声明使用RESP电荷进行拟合。





（若使用BCC拟合，则精度大大下降，但不用计算ESP，直接由PDB结构即可计算）

```
antechamber -i ligand.pdb -fi pdb -o ligand.mol2-fo mol2 -c bcc -nc -1 -pf y
```

## 支线任务：绘制分子静电势（ESP）图

此处选取Gaussian中的cubegen工具+VMD绘图、Multiwfn+VMD绘图两种方法。

具体细节与其他方法、适用范围，请参考**思想化学公社的相关帖子**
[使用vmd+cubegen快速绘制大分子静电势(ESP)图](http://bbs.keinsci.com/thread-6593-1-1.html)



### cubegen生成.cube格点文件

计算化学一言难尽，如有个性化需求，可以看看[官方说明](http://gaussian.com/cubegen/)

需要在Linux中使用Gaussian所自带的工具cubegen。但也需要Windows下的.fchk而非.chk格式作为输入

```
cubegen 8 density=scf output2.fchk out2.cube  -2 h
```

从前到后各参数含义为

- nprocs 使用的核数。越大计算速度越快。此处为8

- kind 指定生成格点的类型。常用以下选项：

  ```
  MO=n	生成第n个分子轨道. Homo, Lumo, All, OccA (所有alpha占据), OccB (所有beta占据), Valence (所有价轨道) and Virtuals (虚轨道) 也可以作为关键词代替n 
  Density=type	type关键词可以为SCF, MP2, CC, CI等。默认为SCF.
  ```

  官方提供的还有：

  ```
  Spin=type	Spin density (difference between α and β densities) of the specified type.
  Alpha=type	Alpha spin density of the specified type.
  Beta=type	Beta spin density of the specified type.
  Potential=type	Electrostatic potential using the density of the specified type.
  Gradient	Compute the density and gradient.
  Laplacian	Compute the Laplacian of the density (∇2ρ).
  NormGradient	Compute the norm of the density gradient at each point.
  CurrentDensity=I	Magnitude of the magnetically-induced (GIAO) current density, where I is the applied magnetic field direction (X, Y or Z).
  ShieldingDensity=IJN	Magnetic shielding density. I is the direction of the applied magnetic field, J is the direction of the induced field (X, Y or Z), and N is the number of the nucleus for which the shielding density (GIAO) is to be calculated.
  ```

- 输入的.fchk文件名
- 输出的.cube文件名
- 格点粗糙程度: -2 -3 -4 对应粗糙，中等，精细
- 格式: h表示输出文件中含有头文件；n则不包括



### Multiwfn+VMD （Windows）

可以参考sobereva老师的文章：[**使用Multiwfn+VMD快速地绘制静电势着色的分子范德华表面图和分子间穿透图**](http://bbs.keinsci.com/thread-11080-1-1.html)

#### Multiwfn生成格点文件

multiwfn可以[**在此下载**](..\..\file\Amber\multiwfn.zip)



首先，需要将此前生成的*.fchk文件命名为1.fch并放在multiwfn.exe同一目录下。（此处无需用到2.fch, 3.fch, 4.fch，这些是用来绘制多分子作用的VDWs表面穿透图的）

在此目录下同时还需要三个.bat文件(ESPiso.bat, ESPpt.bat, ESPext.bat)，以及三个对应的.txt文件[**在此下载**](../../file/Amber/ESP.txt.zip)输入参数。[可以参考examples\drawESP目录下的示范文件]

三个.bat文件如下：
**ESPiso.bat**

```
Multiwfn 1.fch -ESPrhoiso 0.001 < ESPiso.txt
move /Y density.cub density1.cub
move /Y totesp.cub ESP1.cub
Multiwfn 2.fch -ESPrhoiso 0.001 < ESPiso.txt
move /Y density.cub density2.cub
move /Y totesp.cub ESP2.cub
Multiwfn 3.fch -ESPrhoiso 0.001 < ESPiso.txt
move /Y density.cub density3.cub
move /Y totesp.cub ESP3.cub
Multiwfn 4.fch -ESPrhoiso 0.001 < ESPiso.txt
move /Y density.cub density4.cub
move /Y totesp.cub ESP4.cub

move /Y *.cub "D:\VMD\NX"
```
**ESPpt.bat**

```
Multiwfn 1.fch < ESPpt.txt
move /Y vtx.pdb vtx1.pdb
move /Y mol.pdb mol1.pdb
Multiwfn 2.fch < ESPpt.txt
move /Y vtx.pdb vtx2.pdb
move /Y mol.pdb mol2.pdb
Multiwfn 3.fch < ESPpt.txt
move /Y vtx.pdb vtx3.pdb
move /Y mol.pdb mol3.pdb
Multiwfn 4.fch < ESPpt.txt
move /Y vtx.pdb vtx4.pdb
move /Y mol.pdb mol4.pdb

move /Y *.pdb "D:\VMD\NX"
```
**ESPext.bat**
```
Multiwfn 1.fch < ESPext.txt
move /Y vtx.pdb vtx1.pdb
move /Y mol.pdb mol1.pdb

move /Y *.pdb "D:\VMD\NX"
```

需要注意，.bat文件中，最后一行move命令的地址应对应实际的目标存储路径（此处为"D:\VMD\NX")



而对应的txt文件则可以直接[**在此下载**](../../file/Amber/ESP.txt.zip)



分别运行.bat文件

#### 使用VMD绘图

1. 同样的，参考examples\drawESP中的三个对应.vmd文件（[**在此下载**](../../file/Amber/ESP.vmd.zip)），拷贝（或自己按需求重新编写/修改）至上文.bat中定义的.pdb存储路径


2. 把目录中的所有文件拷贝至VMD工作目录（Windows与Linux版本均可）

3. 打开VMD，在命令行中输入：

   ```
   source ESPpt.vmd
   ```

   即可绘制分子表面*格点*静电势分布图

4. **或者**在VMD命令行输入**（在此之前，不要进行第3步)**

   ```
   source ESPiso.vmd
   ```

   则绘制*电子密度等值面图*

5. ***在3或4的基础上***，**<u>继续</u>**输入

   ```
   source ESPext.vmd
   ```

   则可以在之前的基础上，在图中标注极值点（黄点=静电势极大值；蓝点=静电势极小值）

# 附录3 PBS任务提交方法

PBS是现在集群服务器较为常用的一种任务管理系统。在提交一些大型任务时，需要使用该系统为所在账号的任务申请可用节点，排队取得使用权后才可使用。这里简要介绍一下PBS中提交任务的方式

#### PBS常用命令

PBS提供4条命令用于作业管理。

##### (1)qsub 命令—用于提交作业脚本 

命令格式：

```
qsub  [-a date_time] [-c interval] [-C directive_prefix] [-e path] [-I] [-j join] [-k keep] [-l resource_list]  [-m mail_options] [-M user_list][-N name] [-o path] [-p priority] [-q destination] [-r c] [-S path_list] [-u user_list][-v variable_list] [-V] [-W additional_attributes] [-z]
```

参数说明：因为所采用的选项一般放在pbs脚本中提交，所以具体见PBS脚本选项。

例：

```
qsub  aaa.pbs       
```

提交某作业，系统将产生一个作业号

 

(2)qstat 命令—用于查询作业状态信息

命令格式：

```
qatat [-f][-a][-i] [-n][-s] [-R] [-Q][-q][-B][-u]
```

参数说明：

-f  jobid  列出指定作业的信息

-a         列出系统所有作业

-i         列出不在运行的作业

-n         列出分配给此作业的结点

-s         列出队列管理员与scheduler所提供的建议

-R    列出磁盘预留信息

-Q         操作符是destination id，指明请求的是队列状态  

-q         列出队列状态，并以alternative形式显示

-au userid 列出指定用户的所有作业

-B         列出PBS Server信息

-r         列出所有正在运行的作业

-Qf queue  列出指定队列的信息

-u         若操作符为作业号，则列出其状态。若操作符为destination id，则列出运行在其上的属于user_list中用户的作业状态。

例：

```
qstat -f 211 
```

查询作业号为211的作业的具体信息。

##### (3) qdel 命令—用于删除已提交的作业

命令格式：

```
qdel  [-W 间隔时间] 作业号
```

例：

```
qdel -W 15 211 
```

15秒后删除作业号为211的作业

##### (4) qmgr 命令—用于队列管理  

```
qmgr -c "create queue batch queue_type=execution"  

qmgr -c "set queue batch started=true"  

qmgr -c "set queue batch enabled=true"  

qmgr -c "set queue batch resources_default.nodes=1"  

qmgr -c "set queue batch resources_default.walltime=3600"  

qmgr -c "set server default_queue=batch"
```

#### PBS脚本文件 

PBS脚本文件由脚本选项和运行脚本两部分组成。

#### (1) PBS作业脚本选项 （若无-C选项，则每项前面加‘#PBS’）

-a  date_time ： date_time格式为：[[[[CC]YY]MM]DD]hhmm[.SS] 表示经过date_time时间后作业才可以运行。

-c  interval   ： 定义作业的检查点间隔，如果机器不支持检查点，则忽略此选项。

-C  directive_prefix ：在脚本文件中以directive_prefix开头的行解释为qsub的命令选项。（若无此选项，则默认为’#PBS’ ）

-e  path     ：将标准错误信息重定向到path

-I           ：以交互方式运行

-j  join     ：将标准输出信息与标准错误信息合并到一个文件join中去。

-k  keep     ：定义在执行结点上保留标准输出和标准错误信息中的哪个文件。  keep为o 表示保留前者，e表示后者，oe或eo表示二者都保留，n表示皆不保留。若忽略此选项，二者都不保留。

-l  resource_list  ： 定义资源列表。

**以下为几个常用的资源种类。**   

cput=N         ： 请求N秒的CPU时间; N也可以是hh:mm:ss的形式。    

mem=N[K|M|G][B|W]：请求N {kilo|mega|giga}{bytes|words} 大小的内存。    

nodes=N:ppn=M     ：请求N个结点，每个结点M个处理器。

-m  mail_options ：mail_option为a：作业abort时给用户发信；为b：作业开始运行发信；为e：作业结束运行时发信。若无此选项，默认为a。

-M  user_list    ： 定义有关此作业的mail发给哪些用户。

-N  name         ： 作业名，限15个字符，首字符为字母，无空格。

-o  path         ： 重定向标准输出到path。

-p  priority     ： 任务优先级，整数，[-1024，1023]，若无定义则为0.

-q  destination  ： destination有三种形式： queue , @server,queue@server。

-r  y|n          ： 指明作业是否可运行，y为可运行，n为不可运行。

-S  shell        ： 指明执行运行脚本所用的shell，须包含全路径。

-u  user_list    ： 定义作业将在运行结点上以哪个用户名来运行。

-v  variable_list ： 定义export到本作业的环境变量的扩展列表。

-V                ： 表明qsub命令的所有环境变量都export到此作业。

-W  additional_attributes  ： 作业的其它属性。

-z               ： 指明qsub命令提交作业后，不在终端显示作业号。



#### 例

此处是提交Gaussian计算任务的一个PBS脚本，输入文件为input.gjf，

```

##提交任务参数
#PBS -N test
#PBS -l nodes=1:ppn=16
#PBS -l walltime=360:00:00
#PBS -q normal
#PBS -j oe
#PBS -V
#PBS -S /bin/bash

cd $PBS_O_WORKDIR
#export LINDA_PATH=~/g09/g09/linda8.2/opteron-linux/
#export PATH=$LINDA_PATH/bin:$PATH
#export LD_LIBRARY_PATH=$LINDA_PATH/lib:$LD_LIBRARY_PATH


##配置Gaussian09运行环境
export g09root=~/g09
export GAUSS_SCRDIR=$g09root/scratch
export PATH=$PATH:$g09root/g09
source $g09root/g09/bsd/g09.profile

MEM=4GW
NprocShared=16
FILENAME=input.gjf    ##输入文件为

if [ ! -e $FILENAME ] 
then 
          echo "$FILENAME does not exist,g09 can not run" 
         exit 1 
fi 

#cat $PBS_NODEFILE >nodefile 
LINE=`cat $PBS_NODEFILE | sort | uniq | tee nodelist.$$ | wc -l ` 
i=1 
string="%lindaworker=" 
echo nodelist.$$ > 111
while [ $i -le $LINE ] 
do  
         node=`sed -n "$i p" nodelist.$$` 
        if [ $i -eq $LINE ];  then 
           string=$string$node
        else 
           string=$string$node"," 
        fi 
       let i+=1 
done 

##echo $string >string
string2="%mem=$MEM"
string3="%nprocshared=$NprocShared"
sed -i -e '/^\%mem=/d' -e '/^\%nprocshared=/d' -e '/^\%lindaworker=/d' $FILENAME
sed -i  "1 i $string2" $FILENAME
sed -i  "1 i $string3" $FILENAME
sed -i  "1 i $string"  $FILENAME


rm -f nodelist.$$ 
g09 < $FILENAME >out.log #提交任务
```



# 附录4 参考资料下载

若有Debug需求或是需要进一步了解原理、参数含义等等，还是强烈建议查询Amber官方使用手册：



Amber18 Reference Manual [下载链接](../../file/Amber/manual_18.pdf)

Amber21 Reference Manual [下载链接](../../file/Amber/manual_21.pdf)



以及分子动力学原理的入门介绍

Understanding Molecular Simulation - From Algorithms to Applications 

(by Daan Frenkel & Berend Smit)

[下载链接](../../file/Amber/Understanding_Molecular_Simulation.pdf)



计算化学与Gaussian的入门介绍

Exploring Chemistry with Electronic Structure Methods

(by James B. Foresman & AEleen Frisch)

[下载链接](../../file/Amber/Exploring_Chemistry_with_Electronic_Structure_Methods.pdf)





# 附录5 其他

## mmpbsa.py中缺少所需原子类型的半径参数

在体系中含有部分原子（如Fe）时，由于程序中原先不含有其原子半径的信息，因此运行时出现报错：

**bad atom type: Fe**

此时就需要人为添加相关信息。在源文件中添加信息后，重新进行编译。

在解压后的Amber目录下，寻找到mdread.F90文件（可能在这个目录中）

```
$AMBERHOME/AmberTools/scr/sander
```

在Amber18中，mdread.F90不直接包含编码信息，而是调用mdread1.F90与mdread2.F90.

原子半径参数写于mdread2.F90文件中，故编辑此，向其中添加铁原子半径

```
if ( gbsa == 1 ) then   ####可以搜索此句从而快速定位到原子半径所处的位置
......
......

#############下方内容是需要添加的（内容1）
else if (atype(1:1) == 'FE' .or. atype(1:1) == 'Fe') then
        x(l165-1+i) = 0.78d0 + 1.4d0
        x(l170-1+i) = 0.00000d0
        x(l175-1+i) = -0.00000d0
        x(l180-1+i) = -0.00000d0
        x(l185-1+i) = 0.00000d0
#############上方内容是需要添加的
......
......
 end if
     end do ! i=1,natom
     !
   else if ( gbsa == 2 ) then ### 或者搜索此句以定位
......
......
#############下方内容是需要添加的（内容2）
else if (atype(1:1) == 'FE' .or. atype(1:1) == 'Fe') then
        x(l165-1+i) = 0.78d0 + 1.4d0 
#############上方内容是需要添加的
...... 
......
```

**建议将添加的原子参数追加在if(gbsa==1)或else if(gbsa==2)内的最后一个原子对应的else if之后，bad atom报错对应的else if前**

如，对于gbsa==1的if函数内的语句，其末尾为：

```
#省略之前内容，下面展示该函数体末尾内容
	    else if (atype == 'F') then
               x(l165-1+i) = 1.47d0 + 1.4d0
               x(l170-1+i) = 0.68563d0
               x(l175-1+i) = -0.1868d0
               x(l180-1+i) = -0.00135573d0
               x(l185-1+i) = 0.00023743d0
            #######将内容（1）添加至此
            else
               ! write( 0,* ) 'bad atom type: ',atype
               ! call mexit( 6,1 )
               x(l165-1+i) = 1.70 + 1.4;
               x(l170-1+i) = 0.51245;
               x(l175-1+i) = -0.15966;
               x(l180-1+i) = -0.00019781;
               x(l185-1+i) = 0.00016392;
               write(6,'(a,a)') 'Using carbon SA parms for atom type', atype
            end if
         end do  !  i=1,natom
         !
      else if ( gbsa == 2 ) then
```

之后即为gbsa==2的else if内的语句

```
#省略之前内容，下面展示该函数体末尾内容
            else if (atomicnumber .eq. 12) then
               !  Mg radius = 0.99A: ref. 21 in J. Chem. Phys. 1997, 107, 5422
               !  Mg radius = 1.18A: ref. 30 in J. Chem. Phys. 1997, 107, 5422
               !  Mg radius = 1.45A: Aqvist 1992
               x(L165-1+i) = 1.18d0 + 1.4d0
            #######将内容（2）添加至此
            else
               write( 0,* ) 'bad atom type: ',atype
               FATAL_ERROR
            end if

            ! dummy LCPO values:
            x(L170-1+i) = 0.0d0
            x(L175-1+i) = 0.0d0
            x(L180-1+i) = 0.0d0
            x(L185-1+i) = 0.0d0
            !  write(6,*) i,' ',atype,x(L165-1+i)
         end do  !  i=1,natom

      end if ! ( gbsa == 1 )

   end if  ! ( igb /= 0 .and. igb /= 10 .and. ipb == 0 )
```

之后按照安装Amber的步骤，重新编译安装即可！

> <p align="center">感谢杨志伟教授及其课题组成员的支持与帮助！</p>

> <p align="right">created by SuperCRISPR</p>
> <p align="right">Oct.1, 2022</p>



<p style="color:rgb(93, 93, 93) ; font-size: 20px ;text-align:center">
                Copyright © 陈泓宇
</p>

<div style="height:8px;"></div>

<p style="color:rgb(93, 93, 93) ; font-size: 20px ;text-align:center">
               转载请注明出处
</p>