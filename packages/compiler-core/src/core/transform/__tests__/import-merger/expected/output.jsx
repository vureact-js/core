import { useComputed, useReactive, useVRef } from '@vureact/runtime-core';
import React, { memo, useRef, useState, useCallback } from 'react';
const Input = memo(() => {
  React.useState();
  memo();
  useReactive();
  useComputed();
  useCallback();
  useRef();
  useState();
  const s = useVRef;
  useReactive;
  const fn = useCallback(() => {
    s.value;
  }, [s.value]);
  return null;
});
export default Input;