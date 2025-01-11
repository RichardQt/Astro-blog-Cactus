---
title: MySQL笔记
description: MySQL笔记
publishDate: 2025-01-10
tags:
  - 考研
ogImage: /social-card.avif
---

# MySQL笔记

## 登陆和退出mysql

```sql
# 登录MySQL
$ mysql -u root -p12345612 -h 

# 退出MySQL数据库服务器
exit;
```



## 一、检索数据

```sql
1、选择数据库
show databases;
use crashcourse;
show tables;
show grants;   【用来显示授予用户（所有用户或特定用户）的安全权限】
show status;   【用于显示广泛的服务器状态信息】
show columns from 表名; 等同于 describe 表名;
检索单个列
select 列名 from 表名;
注意：MySQL是不区分大小写的，且其中所有的空格都被忽略，所以sql语句可以分成多行
检索多个列
select 列名,列名,列名 from 表名;
检索所有列
select * from 表名;
检索不同的行（去重）
select distinct 列名 from 表名; 【distinct 是关键字,目的是为了去重】
限制输出结果（limit）
(limit 5代表是返回5行结果)
select 列名 from products limit 5;
(limit 5,3代表是从第五行开始返回3行结果，也可写成 limit 3 offset 5【顺序不可错，offset代表从第几行开始】)
select 列名 from products limit 5,3
select 列名 from products limit 3 offset 5;               offset：偏移量】

使用完全限定的表名
select 表名.列名 from products;
select 表名.列名 from 数据库名.表名;

```

## 二、排序检索数据

```sql
单列排序数据
select prod_name from products order by prod_name（按照prod_name的字母顺序进行排序,（默认是升序））
```

**如果字段名是字符串则按照字母顺序进行排序，否则按照数字大小进行排序**

```sql
多列排序数据
select prod_id,prod_price,prod_name from products order by prod_price,prod_name;
```

**【注意：仅在多个行具有相同的prod_price值时才对产品按照`prod_name`进行排序。如果按照`prod_price`列中所有的值都是唯一的，则不会按照`prod_name`进行排序，即`prod_price`为第一关键字，`prod_name`为第二关键字】**

```sql
指定排序方向
select prod_id,prod_price,prod_name from products order by prod_price desc; 【desc是关键字，意为对列进行降序排序，只应用到直接位于其前面的列名】
select prod_id,prod_price,prod_name from products order by prod_price asc;【asc是关键字，意为对列进行升序排序，默认是升序，可不写】
```



## 三、过滤数据(条件查询)



| **< 或者<=**      | **小于或者小于等于** |
| ----------------- | -------------------- |
| **>或者>=**       | **大于或者大于等于** |
| **!= 也可写成<>** | **不等于**           |

### **3-1、where子句**

#### **3-1-1、or,and 操作符**

```sql
使用where子句进行过滤
select prod_name,prod_price from products where prod_price ==2.50;
```

**【关于where子句的位置：在同时使用order by 和 where子句时应将where子句放在order by子句的前面，否则会产生错误，**
**where子句有八个操作符，操作符和其他语言基本一样】**

```sql
检查单个值
select prod_name,prod_prod_price from products where prod_name = '..';
```

**为了更强的过滤控制，`MySQL`允许多个`where`子句结合使用：以and或者or子句的方式进行使用；**

**操作符`and`，代表同时匹配所有条件**

**操作符`or`，代表匹配任意条件**

```sql
计算次序
select vend_id,prod_name,prod_price from products where vend_id = 1002 or vend_id=1003 and prod_price >=10;
和
select vend_id,prod_name,prod_price from products where (vend_id = 1002 or vend_id=1003 )and prod_price >=10;
```

**MySQL语言在处理or操作符之前，优先处理`and`操作符，因为`and`操作符`优先级更高`(即优先处理and操作符 ，若想要or操作符先执行，即在or左右加上小括号**

#### **3-1--2、in操作符（not in操作符）**

- **in操作符完成与or操作符相同的功能,但比or操作符简化了许多操作**

   - ```sql
      select vend_id,prod_name,prod_price from products where vend_id = 1002 or vend_id=1003;
      等同于
      select vend_id,prod_name,prod_price from products where vend_id in(1002,1003)
      【表示查询vend_id = 1002或vend_id = 1003 】
      ```

      **in 后面接上的不是一个区间，而是具体的值**

   

- **in操作符后面也可以嵌套子查询**

   - ```sql
      SELECT
      	cust_name,
      	cust_contact 
      FROM
      	customers 
      WHERE
      	cust_id IN (
      	SELECT
      		cust_id 
      	FROM
      		orders 
      	WHERE
      	order_num IN ( SELECT order_num FROM orderitems WHERE prod_id = 'TNT2' ));
      ```
      
      

#### **3-1-3、not操作符**

**where子句中的not操作符有且只有一个功能，就是否定该子句之后所跟的任何条件**

```sql
select vend_id,prod_name,prod_price from products where vend_id not in (1002,1003) order by prod_name;
【匹配除vend_id 等于1002和1003之外其他所有的id】
```

#### 3-1-4、between  值1 and  值2 

**表示在两个值之间，等同于 >= 值1 and  <=值2**

**注意：在使用between  .. and时需要遵循左小右大原则，两边均为闭区间 **

#### 3-1-5、IS NULL 代表 NULL （is not NULL 代表不为空）

```sql
select cust_name from customers where cust_contact is null;
【表示空时只能写成is NULL】
```

**注意：不能写成 where cust_contact = NULL  ，因为数据库中的NULL代表啥也没有，它不是一个值，所以不能用等号进行连接**

#### 3-1-6、IF NULL 空值处理函数

**第一个值为选取的列，第二个值为将NULL替换的值**

```sql
select cust_name,ifnull(cust_contact,0) from customers
```



## **四、用通配符进行过滤（模糊查询）**

**通配符常用来匹配值的一部分特殊字符**

**在where子句中使用通配符前，必须先使用like操作符**

### **4-1、百分号（%）通配符**

**在子句中，%代表任何字符出现的任意次数,**

**通配符可以位于搜索位置的任何地方，不同位置仅代表匹配不同的值**

```sql
select prod_id,prod_name from products where prod_name like 'jet%';【匹配prod_name中所有以jet开头的值】
select prod_id,prod_name from products where prod_name like '%anv%';【匹配prod_name中任何位置含有anv的值】
...
```

***%通配符，无法匹配值为null***

### **4-2、下划线（_）通配符**

**在子句中，下划线`__`通配符和百分号`%`通配符用途一样，但唯一的一点区别是一个下划线通配符只能匹配  <u>单个字符</u>  而不是多个字符，但下划线通配符可以重复使用，(即一个下划线代表一个字符)，同样百分号`%`同时匹配多个字符**

```sql
select prod_id,prod_name from products where prod_name like '_arrots';【匹配prod_name中值为Carrots】
select prod_id,prod_name from products where prod_name like '__rrots';【匹配prod_name中值为Carrots】
```
**注意：**

* **若要查找特殊字符时，需要在前面加上转义字符 `\`**

* ```sql
   查找特殊字符‘\’需要在前面在加上一个‘\’
   select * from products where prod_name like '\\';  【查找单个\】
   +---------+---------+-----------+------------+-----------------------------+
   | prod_id | vend_id | prod_name | prod_price | prod_desc                   |
   +---------+---------+-----------+------------+-----------------------------+
   | TNT2    |    1003 | \         |      10.00 | TNT, red, pack of 10 sticks |
   +---------+---------+-----------+------------+-----------------------------+
   ```

* **对于使用SQLAlchemy查询sql语句的时候，需要将SQL中单个百分号 `%` 改成两个百分号 `%%` 。(切记) **



## **五、用正则表达式进行匹配（使用REGEXP）**



### **5-1、基本字符匹配 （`.` 字符）**

#### **5-1-1、选择单个值**

```sql
select prod_name from products where prod_name regexp '1000' order by prod_name; 
```

【`REGEXP`为关键字，意为`regexp`后所跟的东西为正则表达式】

**等同于**

```sql
select prod_name from products where prod_name like '%1000';
```

#### **5-1-2、对于选择多个值**

**加入正则表达式写法**：

```sql
select prod_name from products where prod_name regexp '.000' order by prod_name 
```

**等同于**

```sql
select prod_name from products where prod_name like '%000';
```

**【`.`是正则表达式语言中一个特殊的字符，它表示能匹配任意一个字符，本行中匹配所有含有000的值】**

**等同于**

```sql
select prod_name from products where prod_name like '%000';
```

**【注意：MySQL中的正则表达式匹配<u>不区分大小写</u>，如果想区分大小写可加入`BINARY`关键字】**

### **5-2、进行or匹配（`|`字符）**

**`|`字符也是正则表达式中的字符**

```sql
select prod_name from products where prod_name regexp '1000|2000' order by prod_name;【匹配含1000或者2000】
```

**等同于**

```sql
select prod_name from products where prod_name like '%1000' or prod_name like '%2000';
```

### **5-3、匹配几个字符之一(中括号`[]`的使用)**

**`[]`字符也是正则表达式中的字符**

```sql
select prod_name from products where prod_name regexp '[123]' order by prod_name;【[123]定义一组字符，它的意思是匹配1或2或3】
```

***正如所见 `[]` 是另一种形式的  `or`语句，事实上正则表达式`[123] `为`[1|2|3] `的缩写***

**等同于**

```sql
select prod_name from products where prod_name regexp '[1|2|3]';
```

**等同于**

```sql
select prod_name from products where prod_name regexp '1|2|3';【任意匹配所有含有1或者2或者3的值】
```

**当然字符集合也可以匹配<u>除指定字符外的任何东西</u>，只需在集合前放置一个 `^` 符号**

```sql
select prod_name from products where prod_name regexp '[^123]' order by prod_name;【匹配除含123之外的其他值】
```
**区别于**

```sql
select prod_name from products where prod_name regexp '^[1|2|3]';   【匹配以1或2或3开头的字段】
```



### 5-4、匹配范围（`—`的使用）

**集合可用来定义要匹配的一个或者多个字符**

```sql
select prod_name from products where prod_name regexp '[1-3] Ton' order by prod_name;
```

**【为了简化范围可使用"-"来定义一个范围】**

### 5-5、匹配特殊字符

**为了匹配特殊字符，必须要用`\\`为前导。`\\+xx` 代表查找xx；<u>`\\-`表示查找 `-` ； `\\.`表示查找 `.`</u> ;**

* 使用时不要在中括号里使用两个`\\`来匹配特殊字符，若想匹配特殊字符时，只需要`\+xx`来匹配`xx`

```sql
select vend_name  from vendors where vend_name regexp '\\.';【匹配含.的所有值】
```

### 5-6、匹配字符类（常用）

| **类**        | **说明**                       |
| ------------- | ------------------------------ |
| **[:alnum:]** | **任意字母和数字**             |
| **[:alpha:]** | **任意字符**                   |
| **[:digit:]** | **任意数字[0-9]**              |
| **[:space:]** | **包含空白在内的任意空白字符** |

### 5-7、匹配多个实例

|   **元字符**   |             **说明**              |
| :------------: | :-------------------------------: |
|    **`*`**     |        **0个或者多个匹配**        |
|    **`+`**     |        **1个或者多个匹配**        |
| **`？`(常见)** |        **0个或者1个匹配**         |
|  **`｛n｝`**   |        **指定数目的匹配**         |
|  **`{n,m}`**   | **匹配数目的范围【m,不少于255】** |

**例1、**

```sql
select prod_name from products where prod_name regexp '\\( [0-9] sticks? \\)' order by prod_name;
```

**【正则表达式说明`\\( [0-9] sticks? \\)`： 其中`\\( `  [匹配括号]；[0-9]匹配一个任意数字，`sticks?`匹配`stick`和`sticks`（加上？使得`s`可选）】**

**例2、**

```sql
select prod_name from products where prod_name regexp '[[:digit:]]{4}';  【匹配列值含有任意四个连续数字的列值】
```

**【`[:digit:]`为匹配任意数字，且本行中要匹配的是一个四个数字连续在一起的集合需要多加一个`[]`,`{4}`为其前面的字符出现4次】**

***等同于***

```sql
select prod_name from products where prod_name regexp '[0-9][0-9][0-9][0-9]';
```

### **5-8、定位符**

| **元字符**  | **类**         |
| ----------- | -------------- |
| `^`         | **文本的开始** |
| **$**       | **文本的结尾** |
| **[[:<:]]** | **词的开始**   |
| **[[:>:]]** | **词的结尾**   |

```sql
select prod_name from products where prod_name regexp '^[0-9\.]';
```

**【匹配以数字或者.开头的值；中括号相当于集合】**

**等同与**

```sql
select prod_name from products where prod_name regexp '^[[:digit:]\.]';
```

***区别于***

```sql
select prod_name from products where prod_name regexp '[0-9\.]';【匹配含数字或者.的值】
```

**注意：**

**一般情况下`\\`代表着转义字符，其匹配特殊字符方法为`\\+特殊字符`，但在中括号中`\\+特殊字符`会同时匹配`特殊字符`和`\`**

***注意：***

**`^`的双重作用：**

**1、在集合中里面表示用于否定该集合；**

**2、在集合外面用于指定文本的开始**

## 六、创建计算字段

### 6-1、拼接字段

**拼接就是将值联结到一起构成单个值，解决办法就是使用concat()函数将两个列拼接在一起**

```sql
select concat(vend_name, vend_id) from vendors order by vend_name;
+----------------------------+
| concat(vend_name, vend_id) |
+----------------------------+
| ACME1003                   |
| Anvils R Us1001            |
| Furball Inc.1004           |
| Jet Set1005                |
| Jouets Et Ours1006         |
| LT Supplies1002            |
+----------------------------+
```

**注意：添加双单引号可增加间距，单引号之间可添加特殊字符**

```sql
select concat(vend_name, ' (', vend_id, ')') from vendors order by vend_name;
+---------------------------------------+
| concat(vend_name, ' (', vend_id, ')') |
+---------------------------------------+
| ACME (1003)                           |
| Anvils R Us (1001)                    |
| Furball Inc. (1004)                   |
| Jet Set (1005)                        |
| Jouets Et Ours (1006)                 |
| LT Supplies (1002)                    |
+---------------------------------------+
```

```sql
select concat(vend_name,' (',vend_country,')') from vendors order by vend_name;
+-----------------------------------------+
| concat(vend_name,' (',vend_country,')') |
+-----------------------------------------+
| ACME (USA)                              |
| Anvils R Us (USA)                       |
| Furball Inc. (USA)                      |
| Jet Set (England)                       |
| Jouets Et Ours (France)                 |
| LT Supplies (USA)                       |
+-----------------------------------------+
```

**也可通过删除数据两侧多余的空格来整理数据，可使用`tirm()`函数，还支持`Ltrim()`,`Rtrim()`分别对应去除左、右侧空格**

```sql
select concat(rtrim(vend_name), ' (',rtrim(vend_country),')') from vendors order by vend_name;
+--------------------------------------------------------+
| concat(rtrim(vend_name), ' (',rtrim(vend_country),')') |
+--------------------------------------------------------+
| ACME (USA)                                             |
| Anvils R Us (USA)                                      |
| Furball Inc. (USA)                                     |
| Jet Set (England)                                      |
| Jouets Et Ours (France)                                |
| LT Supplies (USA)                                      |
+--------------------------------------------------------+
```

**也支持列的别名，使用as关键字**

```sql
select concat(vend_name,' (',vend_country,')') as vend_title from vendors order by vend_name;
+-------------------------+
| vend_title              |
+-------------------------+
| ACME (USA)              |
| Anvils R Us (USA)       |
| Furball Inc. (USA)      |
| Jet Set (England)       |
| Jouets Et Ours (France) |
| LT Supplies (USA)       |
+-------------------------+
【AS关键字要紧跟concat函数后面】
```

### **6-2、执行算术计算**

```sql
select prod_id,quantity,item_price,quantity*item_price as expand_price from orderitems where order_num = 20005;
+---------+----------+------------+--------------+
| prod_id | quantity | item_price | expand_price |
+---------+----------+------------+--------------+
| ANV01   |       10 |       5.99 |        59.90 |
| ANV02   |        3 |       9.99 |        29.97 |
| TNT2    |        5 |      10.00 |        50.00 |
| FB      |        1 |      10.00 |        10.00 |
+---------+----------+------------+--------------+
```

**【'quantity*item_price as expand_price'支持直接在选择列后面执行算术计算，并将计算结果这一列赋予新的名字，且支持加减乘除四种基本算术】**

## 七、使用数据处理函数（单行处理函数）

**单行处理函数的特点：一个输入对应一个输出**

**多行处理函数的特点： 多个输入对应一个输出**

### 7-1、文本处理函数

**常用的文本处理函数**

| **函数**                                  | **说明**                        |
| ----------------------------------------- | ------------------------------- |
| **left()**                                | **返回串左边的字符**            |
| **length()**                              | **返回串的长度**                |
| **locate(要查找的字符串,列名)**           | **查找字符串的位置（从1开始）** |
| **lower()**                               | **将字符串转换 为小写**         |
| **upper()**                               | **将字符串转换为大写**          |
| **L/Rtrim()**                             | **去掉左右边的空格**            |
| **soundex()**                             | **返回串的soundex值**           |
| **substr(列名,第一个字符串的位置, 长度)** | **返回字符串的字符**            |

```sql
select vend_city,locate('ari',vend_city) as locate from vendors;
+-------------+--------+
| vend_city   | locate |
+-------------+--------+
| Southfield  |      0 |
| Anytown     |      0 |
| Los Angeles |      0 |
| New York    |      0 |
| London      |      0 |
| Paris       |      2 |
+-------------+--------+
```

**【locate('要查找的字符串', 列名)】**

```sql
select vend_city,substr(vend_city,2,3) from vendors where vend_city = 'Paris' ;
+-----------+-----------------------+
| vend_city | substr(vend_city,2,3) |
+-----------+-----------------------+
| Paris     | ari                   |
+-----------+-----------------------+
```

### 7-2、日期和时间处理函数

| **函数**   | **说明**                       |
| ---------- | ------------------------------ |
| **Date()** | **返回值的日期部分(包含年月)** |
| **Year()** | **返回值的年份部分**           |
| **time()** | **返回值的时间部分**           |

```sql
select cust_id,order_num from orders where date(order_date) = '2005-09-01';
```

```sql
select cust_id,order_num from orders where year(order_date) = 2005 and Month(order_date) =9;
【返回年份为2005年的和月份为9月的值】
```

```sql
select cust_id from orders where time(order_date) = '14:17:00';
```

**注意：**

**在遇到这种时间和日期格式的尽量使用函数**

### 7-3、数值处理函数

| **函数**   | **说明**             |
| ---------- | -------------------- |
| **abs()**  | **返回值的绝对值**   |
| **pi()**   | **返回圆周率**       |
| **sqrt()** | **返回值的平方根**   |
| **Mod()**  | **返回除操作的余数** |
| **rand**   | **返回一个随机数**   |

## **八、汇总数据（多行处理函数）**

### 8-1、分组函数（聚集函数）

**常见分组函数**

| **函数**             | **说明**                     |
| -------------------- | ---------------------------- |
| **avg()**            | **返回某列的平均值**         |
| **count()/count(*)** | **返回某列的行数**           |
| **max()/min()**      | **返回某列的最大值、最小值** |
| **sum()**            | **返回某列值之和**           |

```sql
select avg(prod_price) as avg_price from products;
```

```sql
select count(*) as num_count from customers;                    
```
**【对表中行数进行计数，无论是否包含空值（NULL）】**

```sql
select count(cust_email) as count_email from customers;
```
**【对特定列进行计数，忽略NULL值】**

```sql
select sum(item_price*quantity) as total_price from orderitems where order_num = 20005
```
【**在求和过程中可同时进行算术运算】**

**注意：**

* **分组函数使用前必须先分组，如果没有分组，则整表默认为一组**
* **分组函数不能直接使用在`where`子句中**



### 8-2、聚集不同值

**使用`distinct`关键字来去重**

```sql
select distinct prood_price from products;
```

### 8-3、组合聚集函数

```sql
select count(*) as num_items,
		min(prod_price) as price_min,
		max(prod_price) as price_max,
		avg(distinct prod_price) as price_avg
from products;
【返回四列，每列单个值】
```

## **九、数据分组**

### **9-1、对数据分组**

**分组是通过`select`语句中的`group by`子句中建立的**

```sql
select vend_id,count(*) as num_prods from products group by vend_id;
+---------+-----------+
| vend_id | num_prods |
+---------+-----------+
|    1001 |         3 |
|    1002 |         2 |
|    1003 |         7 |
|    1005 |         2 |
+---------+-----------+
```

**【`group by`子句对`vend_id`进行排序并分组数据，且对每个vend_id进行统计求和】**

**对比**

```sql
select vend_id,count(*) as num_prods from products;
+---------+-----------+
| vend_id | num_prods |
+---------+-----------+
|    1001 |        14 |
+---------+-----------+
【返回vend_id列的第一个值，并计算所有vend_id的行数】
```

**注意：**

1. **使用`group by` 必须放在 `where`子句的后面，`order by`子句的前面，且`order by`子句一般放在最后(limit之前)**		
   2. ***如果分组列中存在`NULL`值，则会将`NULL`作为一个组单独统计。***
3. **`group by`子句中列出的每个列必须是检索列或者有效的表达式，但不能是分组函数**
   1. **在一条select语句中，如果有`group by`语句的话 ，`select`语句后面只能跟参加分组的字段，以及分组函数，其他的字段一律不能跟（虽然在`mysql`语句中不会报错，但在其他数据库中会报错）**

```sql
select vend_id,count(*) as num_prods from products group by vend_id with rollup;
+---------+-----------+
| vend_id | num_prods |
+---------+-----------+
|    1001 |         3 |
|    1002 |         2 |
|    1003 |         7 |
|    1005 |         2 |
|    NULL |        14 |
+---------+-----------+
【with rollup是用来在分组统计数据的基础上再进行统计汇总，即用来得到group by的汇总信息】
```

### **9-2、过滤分组**

**使用hiving来过滤分组，仅在`group by`子句后面使用，且`having`支持所有`where`操作符**

```sql
select cust_id,count(*) as orders from orders group by cust_id having count(*) >= 2;
+---------+--------+
| cust_id | orders |
+---------+--------+
|   10001 |      2 |
+---------+--------+
```

**注意：**

`having`和`where`子句的差别：`where`子句在数据**分组前**进行过滤，`having`子句在数据**分组后**进行过滤

```sql
 select vend_id,count(*) as num_prods from products where prod_price >= 10 group by vend_id having num_prods >= 2;
```



**<u>注意：order by和group by都会对数据进行排序，但有时候group by输出的结果可能不是分组的顺序，所以如果需要排序时一般在使用group by子句后，应该也加上order by子句</u>**

### **9-3、select子句的顺序**

**`select `..... `from `.... `where `.....` group by` .... `having `... `order by` ..... `limit `.....**

**一般对于group by子句执行的顺序是：**

**先执行`from`..... `where`...... `group by`....... `having `........`select`....... `order by`...... `limit`.....**

## **十、使用子查询(嵌套查询)**

**子查询即嵌套在其他查询中的查询**

### **10-1、使用子查询来进行过滤**

**放在where子句后面**

```sql
select cust_id from orders where order_num in (select order_num from orderitems where prod_id = 'TNT2');
【处理操作时由里向外进行处理，即先执行内部的查询操作，再执行外部的查询操作】
```

**注意：**

**在`where `子句中使用子查询中应该保证`select`语句具有`where`子句中相同数目的列**

### **10-2、作为计算字段使用子查询**

**放在select子句的后面**

```sql
select cust_name,cust_state,(select count(*) from orders where orders.cust_id = customers.cust_id) as orders from customers order by cust_name ;
```

## **十一、连接（联结）**

### **11-1、创建连接**					

**联结是一种机制，用来在一条select语句中关联表，可以联结多个表返回一组输出，联结在运行时关联表中正确的行**

*使用where进行两个表的连接是 `sql92`语法，**不推荐***

```sql
select vend_name,prod_name, prod_price from vendors,products where vendors.vend_id = products.vend_id
order by vend_name,prod_name;
【from子句中列出了两个表，通过where子句将列列名一样，要使用完全限定列名】
```

**注意：**

**笛卡尔积：由没有联结条件的表关系返回的结果为笛卡尔积，检索行的数目是由第一个表中的行数乘以第二个表中的行数**

```sql
select vend_name,prod_name,prod_price from vendors,products order by vend_name,prod_name;
```

#### 11-2、**内连接**

### 11-2-1、**等值连接（常用）**

**目前为止所有的联结都称为等值连接，也称为内部联结**

***也可以换种语法格式来联结两个表*：**

**注意：**

***SQL规范首选` INNER JOIN … ON `语法[`on`后面紧跟两个表的连接条件],可省略 `inner `直接写成 `join .. on ..`。 尽管使用WHERE子句定义比较简单，但是使用明确的联结语法能够确保不会忘记联结条件，有时候这样做也能提升性能。***

```sql
select vend_name,prod_name,prod_price from vendors inner join products on vendors.vend_id = products.vend_id;
【这里两个表的联结关系是接在from子句后面的，通过INNER JOIN关键字，只返回两个表中联结字段相等的行，联结条结用特定的ON子句】
```

#### **11-2--1-1、联结多个表（三表连接）**

**`SQL`对一个`select`语句中可以联结的表的数目没有限制**
**使用`where`进行表的连接（`sql92`写法）**

```sql
SELECT
	prod_name,
	vend_name,
	prod_price,
	quantity 
FROM
	orderitems,
	products,
	vendors 
WHERE
	products.vend_id = vendors.vend_id 
	AND orderitems.prod_id = products.prod_id 
	AND order_num = 20005;
```
**使用内连接`join`进行三表连接(已省略`inner`)（`sql99`写法）**

```sql
SELECT
	prod_name,
	vend_name,
	prod_price,
	quantity 
FROM
	orderitems
	JOIN products ON products.prod_id = orderitems.prod_id
	JOIN vendors ON products.vend_id = vendors.vend_id 
WHERE
	order_num = 20005
```

***子查询可以转换为连接:***

- **使用子查询进行连接**

```sql
SELECT
	cust_name,
	cust_contact 
FROM
	customers 
WHERE
	cust_id IN (
	SELECT
		cust_id 
	FROM
		orders 
	WHERE
	order_num IN ( SELECT order_num FROM orderitems WHERE prod_id = 'TNT2' ));
```

- **使用内连接`join`进行三表连接**

```sql
SELECT
	cust_name,
	cust_contact 
FROM
	customers
	JOIN orders ON customers.cust_id = orders.cust_id
	JOIN orderitems ON orders.order_num = orderitems.order_num 
WHERE
	orderitems.prod_id = 'TNT2'
```

### 11-2-2、非等值连接

**连接条件不是等量关系，称为非等值连接**

```sql
SELECT
	e.ename,
	e.sal,
	s.grade 
FROM
	emp AS e
	JOIN salgrade AS s 
	ON e.sal BETWEEN s.losal AND s.hisal
```



### 11-3、创建高级连接

#### 11-3--1、内连接之自连接

**一个表自己和自己连接**

```sql
SELECT
	p1.prod_id,
	p2.prod_id 
FROM
	products AS p1,
	products AS p2 
WHERE
	p1.vend_id = p2.vend_id 
	AND p2.prod_id = 'DTNTR'
```

**总结：子查询和自联结都可以完成上面所说的那种情况，但是有两个注意点**

**（1）自联结需要使用别名 （AS关键字);   (2)推荐使用自联结，不使用子查询，查询效率相对较高。**

#### **11-3-2、自然联结**

**自然联结是一种特殊的内部联结（等值联结），只是不会出现相同的重复列**

### **11-4、外部联结**

#### 	**11-4-1、左联结**

**在`from`子句中使用关键字`left outer join`（或者` left join`）**（而不是在`where`子句中）

```sql
SELECT
	c.cust_id,
	o.order_num 
FROM
	customers AS c
	LEFT OUTER JOIN orders AS o ON c.cust_id = o.cust_id;
```

#### 	**11--4-2、右联结**

**在`from`子句中使用关键字`right outer join `(或者`right join`)**（而不是在`where`子句中）

```sql
SELECT
	c.cust_i,
	o.order_num 
FROM
	customers AS c
	LEFT OUTER JOIN orders AS o ON o.cust_id = c.cust_id;
```

## **十二 、组合查询**

### **12-1、创建组合查询**

**可用`union`操作符来组合数条SQL查询，将他们的结果组成单个结果集**

```sql
SELECT
	vend_id,
	prod_id,
	prod_price 
FROM
	products 
WHERE
	prod_price <= 5 
UNION
    SELECT
        vend_id,
        prod_id,
        prod_price 
    FROM
        products 
    WHERE
        vend_id REGEXP '1001|1002';
```

**注意：**

**最后一行也可写成含`in`操作符的`where vend_id in (1001,1002)`**

**`union`规则：**

1. ***`union`必须由两条或者两条以上的`select`语句组成，各`select`语句之间用`union`关键字分隔*。**
2. ***`union`每个查询必须包含相同的列、表达式或者聚集函数*。**

**注意：**

1. **`union`从查询结果集中自动除去重复的行，若想返回所有的行，可以使用`union all` 。
2. **若想对组合查询结果排序，则`order by`必须出现在最后一条`select`语句之后，因为在用`union`组合查询时，只能出现一条`order by`子句。**

## 十三、插入数据

**insert into 表名(列名可省略) values 值**

### 13-1、数据插入（单行）

```sql
insert into customers values (NULL,'li shi run','100 main street','los angeles','ca','90046','usa',null,null);
【此例插入一个新客户到customers表。存储到每个列中的数据在values子句中列出，每个列必须提供一个值，若没有具体值，则用NULL替代】
```

**等同于**

```sql
insert into customers(cust_name,cust_address,cust_city,cust_state,cust_zip,cust_country,cust_contact,cust_email)
values('li shi run','100 main street','los angeles','ca','90046','usa',null,null);
【此列在表名后的括号里先给出列名，在插入行时，MySQL用values列表中的相应值填入列表的对应项】
```

**注意：**

**insert语句一般不会产生输出，且列名与值必须一一对应**

### 13-2、插入多行数据

1. **使用多条insert语句**

2. **只要每条insert语句中的列名和次序相同**

   ```sql
   insert into customers(cust_name,cust_address,cust_city,cust_state,cust_zip,cust_country) 
   values('li shi run','100 main street','los angeles','ca','90046','usa'),
   ('zhang qi run','200 main street','xu zhou','ac','90047','usb');
   【单条insert语句有多组值，每组值用一对 圆括号括起来，用逗号分割】
   ```

   

### 13-3、插入检索出的数据

**insert语句一般用来给表插入一个指定列值的行，但是insert语句也可以将一条select语句的结果插入表中**

```sql
insert into customers(cust_id,cust_address,cust_email,cust_name,cust_city,cust_state,cust_zip,cust_country)select cust_id,cust_address,cust_email,cust_name,cust_city,cust_state,cust_zip,cust_country from custnew;
【select语句从custnew表中检索出要插入的值，如果这个表为空，则没有数据插入到customers，如果表中含有数据，则所有数据全插入到customers】
```

**注意：**

**insert select中的select语句也可以包含where子句以过滤插入的数据**

## 十四、更新和删除数据

### **14-1、**更新数据****

**为了更新（修改）表中的数据可以使用UPDATE语句**

***基本的*UPDATE语句用三部分组成：**

1. **要更新的表**
2. **列名和它的新值（通过set语句来将新值赋给被更新的列）**
3. **确定要更新行的过滤条件**

#### 14-1-1、更新单列

```sql
update customers 
set cust_email = 'elemer@fudd.com'
where cust_id = 10005;
【update语句以要更新的表的名字开始。set命令用来将新值赋给被更新的列，通过where子句来告知MySQL要更新哪一行】
```

#### 14-1-2、更新多列

```sql
update customers 
set cust_name = 'The Fudds',
	cust_email = 'elmer@qq.com'
where cust_id = 10005;
```

**注意：**

1. **在更新多个列时，只需要使用单个Set命令，每个“列=值”对之间用逗号分隔（最后一列之后不用逗号）**

2. **在update语句中也可以嵌套使用子查询，一般位置位于where子句之后**

   ```sql
   update orders
   set order_date = '2021-8-30 14:17'
   where order_num in (select order_num from orderitems where prod_id = 'FC');
   ```

3. **为了删除某个列的值，可以将它设置为NULL：**

   ```sql
   update customers
   set cust_zip = NULL
   where cust_id = 10005;
   【不加where子句是删除该列的所有值】
   ```

   

### 14-2、删除表中部分数据

**从一个表中删除数据，可以使用delete语句，它可以既可以删除表中特定的行，也可以删除所有行**

```sql
delete from customers where cust_id = 10006;
【delete form要求指定从表中删除数据的表名。where子句过滤要删除的行】
```

### 14-3、删除表中全部数据

**下列两种仅删除表中数据，不删除表的结构**

1. **使用`delete table + 表名` 语句即可**
   - **删除效率较低，且不支持回滚，但删除后可以恢复数据**
2. **使用`truncate table + 表名` 删除**
   - **删除效率高，但是全部删除完，不能删除单条	，但删除后不支持恢复**

**注意：**

- **`delete`不需要列名或者通配符**
- **`delete`是用于删除整行而不是删除列，如果为了删除特定列，可以使用`drop`语句，当然也可以使用`update`将某列所有值都变为`NULL`**
- **如果要删除某表中的所有行，也可以使用truncate 表名，其速度更快，它的实际意义是删除原来的表并重新创建一个相同同字段的空白表**

### 14-4、删除表

**使用`drop table + 表名` 语句，<u>删除后表中数据和表结构全部删除</u>**

## **十五、创建和操纵表**

### 15-1、创建表

**利用create table创建表，且满足：**

1. **新表的名字在create table之后给出**
2. **表列的名字和定义，用逗号分隔**

```sql
CREATE TABLE test_creat (
  cust_id int NOT NULL AUTO_INCREMENT,
  cust_name varc NOT NULL,
  cust_address char DEFAULT NULL,
  cust_city char DEFAULT NULL,
  PRIMARY KEY (cust_id) 
)ENGINE = InnoDB;
【MySQL实际的表定义（所有列）都在圆括号中。各列之间用逗号分隔
除主键外每列由列名开始，接着是数据类型（例如char数据类型，其长度要在创建时确定），紧接着是是否支持NULL值
表的主键可使用PRIMARY KEY关键字指定】
```

**注意：**

1. **在创建新表时，指定的表名必须不存在，否则将出错，在表名后面加上 IF NOT EXISTS可以避免检测表模式是否匹配而只是检查表名是否存在，并且在表名不存在时创建它**

2. **主键值必须唯一，即每个行必须具有唯一的主键值。如果主键使用单个列，则它的值必须唯一。如果使用多个列，则这些列的组合值必须唯一；为创建多个列组成的主键，应该以逗号分隔的列表给出各列名，且主键所在的列不能使用NULL值**

3. **使用`AUTO_INCREMENT`是告诉MySQL，本列每增加一行时自动增量，且每个表只允许一个`AUTO_INCREMENT`列，而且它必须被索引**

4. **如果插入时没有给出值，MySQL允许指定此时使用的默认值。默认值用create table语句的列定义中的default关键字**

   ```sql
   CREATE TABLE test_creat (
     cust_id int NOT NULL AUTO_INCREMENT,
     cust_name char NULL default lishirun,
     PRIMARY KEY (cust_id) 
   )ENGINE = InnoDB;
   ```

   **即如果在插入数据时没有指定cust_name则默认使用lishirun值**

#### **15-1-1、插入表中数据**

**使用`insert into`语句**

```sql
insert into 创建的表名 
values (相关列的数据) 
```

**和插入数据章节内容一样**

#### **15-1-2、创建索引**

1. **在创建表的同时创建索引**

   ```sql
   CREATE TABLE test1 (
     cust_id int NOT NULL AUTO_INCREMENT,
     cust_name char(50) NOT NULL,
     cust_address char(10),
     cust_city char(10),
     PRIMARY KEY (cust_id),
     index index_id(cust_id) 【格式：index 索引名称(索引所在的列名)】
   )ENGINE = InnoDB;
   ```

2. **在创建表后单独创建索引**

   ```sql
   create index index_id on test1(cust_id); 【单列索引】
   create index index_id on test1(cust_id，cust_name);【复合索引】
   【格式：create index 索引名 on 表名(索引所在的列名)】
   ```

3. ```sql
   查看索引：show index from 表名;
   删除索引：drop index 索引名 on 表名
   		alter table 表名 drop index 索引名
   ```

### **15-2、更新表**

**为了更新表的定义，可使用`alter table`语句**

**为了使用alter table语句来更改表的结构时，应给出：**

1. **在alter table之后给出要更改的表名(该表必须存在，否则将出错)**
2. **所做更改的列表**

#### **15-2-1、增加列，使用ADD关键字**

```sql
alter table vendors 
add vend_phone char(20)
【这条语句在vendors表中增加一个名为vend_phone的列，且必须明确其数据类型】
```

#### **15-2-2、删除列，使用drop关键字**

```sql
alter table vendors 
drop (column) vend_phone
【这条语句在vendors表中删除一个名为vend_phone的列】
```

#### **15-2-3、修改字段数据类型**

**ALTER TABLE <表名> MODIFY <字段名> <数据类型>**

```sql
alter table vendors modify vend_zip char(30);
```

#### **15-2-4、修改字段名称**

**ALTER TABLE <表名> CHANGE <旧字段名> <新字段名> <新数据类型>;**

```sql
alter tables custnew change cust_zip cust_zips char(25);
```

***change也可以只修改数据类型，实现和 MODIFY 同样的效果，方法是将 SQL 语句中的“新字段名”和“旧字段名”设置为相同的名称，只改变“数据类型”。***

#### **15-2-5、修改表名**

**ALTER TABLE <旧表名> RENAME [TO] <新表名>;**

```sql
alter table test_creat rename to create_test;
```

**也可直接使用`rename table`语句直接重命名一个表**

```sql
rename table create_test to test_new;
```

## **十六、视图**

### **16-1、视图的性质**

**视图是虚拟的表。与包含数据的表不一样，视图中只包含使用动态检索数据的的查询**

#### **16-1-1、为什么使用视图**

1. **重用SQL语句**
2. **简化复杂的SQL操作**
3. **使用表的组成部分而不是整个表**
4. **保护数据**
5. **更改数据格式和表示**

##### **16-1-2、视图的规4则和限制**

1. **视图与表一样，必须有唯一命名（且视图名字和表名不能相同）**
2. **对创建视图数目没有限制**
3. **视图可以嵌套**
4. **`order by`可以用在视图中，且检索数据`select`语句中不能包含`order by`语句，否则将被覆盖**
5. **视图可以和表一块使用**

### **16-2、使用视图**

#### **16-2-1、视图的创建**

1. **视图是用`create view`视图 语句来创建**

   ***create view 视图名 as*** 

   ***相关检索语句***

2. **使用`show create view 视图名`；来查看创建视图的语句。**

3. **使用`drop view` 视图名来删除视图。**

4. **更新视图时，可以先用drop再用create语句，也可以直接用`create or replace view` 语句**

   **注意：**

   ***视图是可以修改的，但不是直接修改的视图而是通过修改其构建视图的表来达到修改视图的目的（更新视图本质上是更新其基表），因此视图的主要作用与数据检索***

***（普通检索）***

```sql
select cust_name,cust_contact 
from customers,orders,orderitems
where customers.cust_id = orders.cust_id 
		and orderitems.order_num = orders.order_num
		and prod_id = 'TNT2';
```

**等同于**

***(视图检索)***

```sql
create view productcustomers as
select cust_name,cust_contact,prod_id 
from customers,orders,orderitems 
where customers.cust_id = orders.cust_id
	and orderitems.order_num = orders.order_num;
```

**+**

```sql
select cust_name,cust_contact
from productcustomers 
where prod_id = 'TNT2';
【productcustomers是视图，是一个虚拟的表，它不包含表中应该有的任何列和数据，它包含的是一个相同的查询】
```

###  **16-3、视图的重要作用:**

​	**1、*重新格式化检索出的数据***

**视图的另一常见作用便是重新格式化检索出的数据**

```sql
select concat(rtrim(vend_name), ' (', rtrim(vend_country) ,')') as vend_title  from vendors order by vend_name;
```

**假如需要经常使用这个格式的结果，可以将其创建一个视图以便后续多次使用**

```sql
create view vendorlocations as
select concat(rtrim(vend_name), ' (', rtrim(vend_country) ,')') as vend_title from vendors order by vend_name;
```

**然后可以通过select语句来查询所创建的视图**

```sql
select * from vendorlocations;
```

​	**2、用视图来过滤不想要的数据**

​	**3、视图对简化计算字段特别有用**

## 十七、约束

**约束即在创建表的时候，我们可以给表中的字段加上一些约束，一般在创建表时，字段后面添加，来保证这个表中的数据的完整性和有效性**

**约束包括哪些：**

| ***非空约束***   |
| ---------------- |
| ***主键约束***   |
| ***外键约束***   |
| ***唯一性约束*** |

### 17-1、非空约束 not null 

- **表示约束的字段不能为空**

### 17-2、唯一性约束 unique

### 17-3、**主键约束  primary key 简称（PK）**

- **主键值是每一行记录的唯一标识，任何一张表都应该有主键，没有主键的表是无效的，主键值不能为空，也不能为`NULL`值**
- **主键又分为单一主键和复合主键，复合主键写法：`primary  key(id,name)`，在实际开发中，不建议使用复合主键，建议使用单一主键**
- **一张表，主键约束只能为一个**

### 17-4、**外键约束  foreign key 简称（FK）**

- **外键用来建立主表与从表的关联关系，为两个表的数据建立连接，约束两个表中数据的一致性和完整性。**

- **外键值可以为NULL，且 子表中的外键引用父表中的某个字段不一定要为主表中的主键，但一定要具有唯一性**

- ```sql
   外键约束用法：
     create table 从表名
     	字段1
     	字段2
     	foreign key(字段3) reference 主表（字段）
   ```

- **表示约束的字段不能重复，但可以为NULL**

------

## **十八、常用的存储引擎**

### 18-1、MyISAM 存储引擎 

 **MyISAM 存储引擎是 MySQL 最常用的引擎。** 

– 它管理的表具有以下**特征**：

- 使用三个文件表示每个表： 

- 格式文件 — 存储表结构的定义（mytable.frm）

- 数据文件 — 存储表行的内容（mytable.MYD）

- 索引文件 — 存储表上索引（mytable.MYI） 

– 灵活的 AUTO_INCREMENT 字段处理 – 可被转换为压缩、只读表来节省空间 

### 18-2、InnoDB 存储引擎

**InnoDB 存储引擎是 MySQL 的默认引擎。** （MySQL 5.5版本之后）

– 它管理的表具有下列**主要特征**： 

- 每个 InnoDB 表在数据库目录中以.frm 格式文件表示 
- InnoDB 表空间 tablespace 被用于存储表的内容 
- 提供一组用来记录事务性活动的日志文件 – 用 COMMIT(提交)、SAVEPOINT 及 ROLLBACK(回滚)支持事务处理 
- 提供全 ACID 兼容
- 在 MySQL 服务器崩溃后提供自动恢复 
- 多版本（MVCC）和行级锁定 
- 支持外键及引用的完整性，包括级联删除和更新 

### 18-3、MEMORY 存储引擎

– 使用 MEMORY 存储引擎的表，其数据存储在内存中，且行的长度固定，这两个特点使得 MEMORY 存储引擎非常快。

– MEMORY 存储引擎管理的表具有**下列特征**： 

- 在数据库目录内，每个表均以.frm 格式的文件表示。

- 表数据及索引被存储在内存中。

- 表级锁机制。 – 不能包含 TEXT 或 BLOB 字段。

– **MEMORY 存储引擎以前被称为 HEAP 引擎**



## 十九、SQL面试题

**有 3 个表 S(学生表)，C（课程表），SC（学生选课表）**
**S（SNO，SNAME）代表（学号，姓名）** 
**C（CNO，CNAME，CTEACHER）代表（课号，课名，教师）**
**SC（SNO，CNO，SCGRADE）代表（学号，课号，成绩）**

### **1、第一题：**

**找出没选过“黎明”老师的所有学生姓名。**

```sql
SELECT
	SNAME 
FROM
	s 
WHERE
	SNAME NOT IN (
	SELECT
		ss.SNAME 
	FROM
		s ass
		JOIN sc ON ss.SNO = sc.SNO
		JOIN C ON C.CNO = sc.CNO 
	WHERE
		c.CTEACHER = '黎明' 
	)
```

### **2、第二题：**

**列出 2 门以上（含 2 门）不及格学生姓名及平均成绩。**

```sql
SELECT
	SNAME,
	avg_grade 
FROM
	s
	JOIN (
	SELECT
		SNO,
		AVG( SCGRADE ) AS avg_grade 
	FROM
		sc 
	WHERE
		SNO IN ( SELECT SNO from sc WHERE SCGRADE < 60 GROUP BY SNO HAVING COUNT(*) >= 2 ) 
	GROUP BY
	SNO 
	) t ON (s.SNO = t.SNO)
```

### **3、第三题：**

**学过 1 号课程又学过 2 号课所有学生的姓名。**

```sql
SELECT SNAME FROM s 
WHERE SNO in (
SELECT
	SNO 
FROM
	sc 
WHERE
	CNO = 1 
	AND SNO IN ( SELECT SNO FROM sc  WHERE CNO = 2))
```



## 二十、数据库的三大设计范式

### 第一范式(1 NF)

**要求任何一张表必须有主键，任何一个字段都不能再分**

只要字段**值**还可以继续拆分，就不满足第一范式。

### 第二范式(2 NF)

**要求所有非主键字段完全依赖主键，不要产生部分依赖**

在满足第一范式的前提下，其他非主键字段都必须完全依赖于主键字段。

如果产生依赖，则只会发生在联合主键的情况下：

```sql
-- 订单表
CREATE TABLE myorder (
    product_id INT,
    customer_id INT,
    product_name VARCHAR(20),
    customer_name VARCHAR(20),
    PRIMARY KEY (product_id, customer_id)
);
```

实际上，在这张订单表中，`product_name` 依赖于 `product_id` ，`customer_name` 依赖于 `customer_id` 。也就是说，`product_name` 和 `customer_id` 两者是没有关系的，`customer_name` 和 `product_id` 也是没有关系的。

这就不满足第二范式：其他非主键字段都必须完全依赖于主键列！

**总结：**

- ~~**一般来说，一张表中只要不是联合主键，基本上都满足第二范式**~~

**所以需要将上文中的联合主键拆分成两个主键，即当作两个表：**

```sql
CREATE TABLE myorder (
    order_id INT PRIMARY KEY,
    product_id INT,
    customer_id INT
);

CREATE TABLE product (
    id INT PRIMARY KEY,
    name VARCHAR(20)
);

CREATE TABLE customer (
    id INT PRIMARY KEY,
    name VARCHAR(20)
);
```

拆分之后，`myorder` 表中的 `product_id` 和 `customer_id` 完全依赖于 `order_id` 主键，而 `product` 和 `customer` 表中的其他字段又完全依赖于主键。满足了第二范式的设计！

#### 口诀：

**多对多，三张表，关系表两个外键**

### 第三范式(3 NF)

**要求所有非主键字段直接依赖主键字段**

在满足第二范式的基础上，另外再满足一个条件：非主键列必须**直接**依赖于主键，**不能存在传递依赖。**

```sql
CREATE TABLE myorder (
    order_id INT PRIMARY KEY,
    product_id INT,
    customer_id INT,
    customer_phone VARCHAR(15)
);
```

表中的 `customer_phone` 有可能依赖于 `order_id` 、 `customer_id` 两列，也就不满足了第三范式的设计：其他列之间不能有传递依赖关系。

```sql
CREATE TABLE myorder (
    order_id INT PRIMARY KEY,
    product_id INT,
    customer_id INT
);

CREATE TABLE customer (
    id INT PRIMARY KEY,
    name VARCHAR(20),
    phone VARCHAR(15)
);
```

修改后就不存在其他列之间的传递依赖关系，其他列都只依赖于主键列，满足了第三范式的设计！

#### 例子:

这是一张学生课表：

| 课程编号	（主键） | 课程名字       | 上课时间 | 任课老师 | 老师电话    | 老师职位 |
| -------------------- | -------------- | -------- | -------- | ----------- | -------- |
| 101                  | 马克思理论基础 | 8：00     | Lily     | 18016253155 | 讲师     |
| 102                  | 经济学         | 14：00    | Lucy     | 18055231233 | 教授     |

**大致一看，上表中的非主键列确实完全是依赖于主键（课程编号）的，符合第二范式但是**

​	**问题是：老师电话，老师职位直接依赖的是任课老师（非主键列），而不是直接依赖于主键，它是通过传递才依赖于主键，所以不符合 第三范式(3 NF)。**
**解决方案：**

​		**依然是通过拆分，把上述学生课表拆分为课程表和教师表。**

**课程表：**

| 课程编号 | 课程名字       | 上课时间 | 任课老师 |
| -------- | -------------- | -------- | -------- |
| 101      | 马克思理论基础 | 8：00     | Lily     |
| 102      | 经济学         | 14：00    | Lucy     |

**教师表：**

| 任课老师 | 老师电话    | 老师职位 |
| -------- | ----------- | -------- |
| Lily     | 18016253155 | 讲师     |
| Lucy     | 18055231233 | 教授     |

#### 口诀 ：

​	**一对多，两张表，多的表加外键**



## **补充**

### **1、查询数据库中所有表名：**

```sql
select table_name from information_schema.tables where table_schema='数据库名称' and table_type='base table';
#直接使用下面的查询语句，“数据库名称”替换为你自己的“dbname”即可
```

### **2、查询数据库中所有列名：**

```sql
select column_name from information_schema.columns where table_schema='数据库名称' and table_name='表名'
#直接使用下面的查询语句，“数据库名称”替换为你自己的“dbname”；“表名”替换为你自己的“table_name”;
```

### **3、列的别名**

**使用关键字AS或者直接在列名后加空格，如果别名之间有空格，则需要用双引号框起来**

```sql
select 	employers emp ,last_anme lname from	 e]]mployee
#等同于 select employers as emp ,last_anme as lanme from employee
```

### **4、查看创建表的SQL语句**

```sql
show create table 表名
```

### **5、在进行or匹配时有三种写法：**

- **在where子句用or进行连接**

   - ```sql
      where vend_id = 1001 or vend_id = 1002
      ```

- **在where子句中使用in操作符**

   - ```sql
      where vend_id in (1001 ,1002)
      ```

- **在where子句中使用正则表达式：`|`符号**

   - ```sql
      where vend_id regexp '1001|1002'
      ```

### 6、mysql字符编码

#### 6-1、查看字符编码

`show variables like'character%';`

`show variables like 'collation_%';`

```sql
mysql>show variables like'character%';
+--------------------------+-----------------------------------+
| Variable_name            | Value                             |
+--------------------------+-----------------------------------+
| character_set_client     | utf8                              |
| character_set_connection | utf8                              |
| character_set_database   | utf8                              |
| character_set_filesystem | binary                            |
| character_set_results    | utf8                              |
| character_set_server     | utf8                              |
| character_set_system     | utf8                              |
| character_sets_dir       | D:\phpStudy\MySQL\share\charsets\ |
+--------------------------+-----------------------------------+
mysql> show variables like 'collation_%';
+----------------------+-------------------+
| Variable_name        | Value             |
+----------------------+-------------------+
| collation_connection | utf8_general_ci   |
| collation_database   | latin1_swedish_ci |
| collation_server     | latin1_swedish_ci |
+----------------------+-------------------+
```

**若要更改编码输入指令：**

`set Variable_name = '编码名称'`

**注意：**

**MySQL客户端根本就不能以utf8的形式返回数据**     

#### 6-2、修改数据库的编码方式

`alter database 数据库名称 character set utf-8;`

**创建数据库指定数据库的字符集**

```sql
mysql>create database mydb character set utf-8;
```

####   6-2、修改表的编码方式

`alter table 表名称 character set utf-8;`

##### 6-2-1、修改表中所有字段的编码方式

`alter table 表名称 convert to character set utf8`

##### 6-2-2、修改表中单一字段的编码方式

`alter table 表名称 modify column 字段 varchar(255) character set 字符编码（utf8、latin1） `

**注意：character set不能省略**

6-2-3、

`insert into 表1（字段1）select 字段1 from 表2`
