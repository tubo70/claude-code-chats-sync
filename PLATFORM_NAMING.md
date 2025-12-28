# Claude Code 项目目录命名规则

## 不同平台的路径转换规则

### Windows
**输入路径**: `D:\Projects\MyProject`
**Claude Code 目录名**: `d--Projects-MyProject`

**转换规则**:
- `\` (反斜杠) → `-` (破折号)
- `:` (冒号) → `-` (破折号)
- **保持原有大小写**

**示例**:
- `C:\Users\John\Projects\test-app` → `c--Users-John-Projects-test-app`
- `D:\work\my-awesome-project` → `d--work-my-awesome-project`
- `E:\Development\MyApp` → `e--Development-MyApp`

### Linux
**输入路径**: `/home/user/projects/my-project`
**Claude Code 目录名**: `home-user-projects-my-project`

**转换规则**:
- `/` (正斜杠) → `-` (破折号)
- **保持原有大小写**

**示例**:
- `/home/john/projects/test-app` → `home-john-projects-test-app`
- `/var/www/html/site` → `var-www-html-site`
- `/opt/MyProject/src` → `opt-MyProject-src`

### macOS
**输入路径**: `/Users/john/projects/my-project`
**Claude Code 目录名**: `Users-john-projects-my-project`

**转换规则**:
- `/` (正斜杠) → `-` (破折号)
- **保持原有大小写**

**示例**:
- `/Users/john/projects/test-app` → `Users-john-projects-test-app`
- `/Users/john/work/my-awesome-project` → `Users-john-work-my-awesome-project`
- `/Projects/MyApp` → `Projects-MyApp`

## 符号链接类型

- **Windows**: 使用 `junction`（目录连接点）
- **Linux/macOS**: 使用 `dir`（目录符号链接）

## 测试你的路径

你可以使用以下命令测试转换结果：

```typescript
// 在 VSCode 扩展中
const result = normalizeProjectPath('/your/project/path');
console.log(result);
```
