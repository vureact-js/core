<><div>{/*  v-if/v-else  */}<>{condition ? <div>Third If Content</div> : <div>Third Else Content</div>}</>{/*  v-if/v-else-if 链 / Conditional chain  */}<>{condition ? <div>Second If Content</div> : condition2 ? <div>Second If ElseIf Content</div> : null}</>{/*  v-if/v-else-if/v-else 链 / Conditional chain  */}<>{condition ? <div>If Content</div> : condition2 ? <div>ElseIf Content</div> : <div>Else Content</div>}</>{/*  v-for / Loop  */}<ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>{/*  v-for + v-if / Loop  */}<ul><>{condition ? items.map(item => <li key={item.id}>{item.name}</li>) : null}</></ul>{/*  v-slot: 默认、具名、作用域、动态、嵌套解构 / Slots  */}<MyComponent header={() => "Header Slot"} content={props => <>Content {props.value}</>} {...{
      [dynamicSlot]: data => <>Dynamic {data.info}</>
    }} footer={({
      key: [a, b],
      obj: {
        sub: name
      }
    }) => <> Footer {a} {b} {name}</>}>{/*  默认插槽 / Default slot  */}{/*  具名插槽 / Named slot  */}{/*  作用域插槽 / Scoped slot  */}{/*  动态插槽 / Dynamic slot  */}{/*  嵌套解构 / Nested destructuring  */}</MyComponent>{/*  v-on: 带修饰符 / Event with modifiers  */}<button onClick={e => {
      e.stopPropagation();
      e.preventDefault();
      handleClick(e);
    }}>Click Me</button><input onKeydown={e => {
      if (e.key !== "Enter") return;
      submit(e);
    }} placeholder="Enter to submit" /><div onClick={{
      handler: useCallback(e => {
        onceClick(e);
      }, []),
      capture: true
    }}>Once Click</div><div onMouseup={e => {
      if (e.target !== e.currentTarget) return;
      if (e.button !== 0) return;
      if (e.key !== "ArrowLeft") return;
      leftClick(e);
    }}>Left Click Self</div>{/*  v-bind: 静态、动态 / Binding  */}<div className={dynamicClass} {...{
      [dynamicAttr]: value
    }}>Bound Div</div>{/*  v-model  */}<input {...{
      value: inputValue,
      onInput: e => {
        updateInputValue(e.target.value);
      }
    }} /><input {...{
      checked: inputValue,
      onInput: e => {
        updateInputValue(e.target.checked);
      }
    }} type="checkbox" /><select {...{
      modelValue: inputValue,
      onUpdate_ModelValue: e => {
        updateInputValue(Array.from(e.target.selectedOptions, o => o.value));
      }
    }} multiple />{/*  v-model modifiers  */}<input {...{
      value: inputValue,
      onInput: e => {
        updateInputValue(Number.parseFloat(e.target.value));
      }
    }} type="text" />{/*  v-model prop name  */}<MyInput {...{
      value: inputValue,
      onUpdate_Title: e => {
        updateInputValue(e);
      }
    }} /><MyInput {...{
      [dynamicAttr]: inputValue,
      [`onUpdate_${dynamicAttr}`]: e => {
        updateInputValue(e);
      }
    }} />{/*  v-show / Conditional display  */}<div style={{
      display: isVisible ? "" : "none"
    }}>Visible Div</div>{/*  v-html / Raw HTML  */}<div dangerouslySetInnerHTML={{
      __html: rawHtml
    }} />{/*  v-text / Text content  */}{textContent}{/*  v-pre  */}<div><span>Static</span> {{ rawContent }}</div>{/*  v-cloak / Hide until compiled  */}<div style="display: none">Cloaked Div</div>{/*  v-once  */}{useMemo(() => <div>Once</div>, [])}{/*  v-memo  */}{useMemo(() => <div />, [value])}{useMemo(() => <div />, [condition, condition2])}</div></>