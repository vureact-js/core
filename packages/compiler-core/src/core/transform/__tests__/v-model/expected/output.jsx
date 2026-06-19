import { memo } from 'react';
const Input = memo(() => {
  return <>{/* 示例1: 基础用法 */}<input value={text} onChange={e => {
      text = e.target.value;
    }} placeholder='输入文本...' />{/* 示例2: 修饰符 .lazy */}<input value={lazyText} onBlur={e => {
      lazyText = e.target.value;
    }} placeholder='输入后按回车或失去焦点...' />{/* 示例3: 修饰符 .number */}<input value={numberValue} onChange={e => {
      numberValue = Number(e.target.value);
    }} type='number' placeholder='输入数字...' />{/* 示例4: 修饰符 .trim */}<input value={trimmedText} onChange={e => {
      trimmedText = e.target.value?.trim();
    }} placeholder='输入带空格的文本...' />{/* 示例5: 多行文本 textarea */}<textarea value={message} onChange={e => {
      message = e.target.value;
    }} placeholder='输入多行文本...' />{/* 示例6: 复选框 */}<input type='checkbox' id='checkbox' checked={checked} onChange={e => {
      checked = e.target.checked;
    }} />{/* 示例8: 单选框 */}<input type='radio' id='male' value='男' checked={gender === "男"} onChange={() => {
      gender = "男";
    }} />{/* 示例9: 下拉选择框 */}<select value={selectedOption} onChange={e => {
      selectedOption = e.target.value;
    }} />{/* 示例10: 多选下拉框 */}<select value={multipleOptions} onChange={e => {
      multipleOptions = e.target.value;
    }} multiple /><ChildInput value={iam} onUpdateValue={value => {
      iam = value;
    }} /></>;
});
export default Input;