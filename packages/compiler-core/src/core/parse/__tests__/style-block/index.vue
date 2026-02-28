<template></template>

<style lang="less">
@primary-color: #1890ff;
@padding-base: 12px;

.container {
  padding: @padding-base;
  background-color: lighten(@primary-color, 40%);

  .title {
    color: @primary-color;
    font-size: 24px;
    &:hover {
      text-decoration: underline;
    }
  }

  .content {
    margin-top: @padding-base;
    border: 1px solid darken(@primary-color, 10%);
    border-radius: 4px;
    padding: @padding-base / 2;
  }
  .button-group {
    display: flex;
    gap: 8px;
    margin-top: @padding-base;

    .btn {
      padding: @padding-base / 2 @padding-base;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &.primary {
        background-color: @primary-color;
        color: white;

        &:hover {
          background-color: darken(@primary-color, 10%);
        }
      }

      &.secondary {
        background-color: lighten(@primary-color, 30%);
        color: darken(@primary-color, 20%);
        border: 1px solid darken(@primary-color, 10%);

        &:hover {
          background-color: lighten(@primary-color, 20%);
        }
      }
    }
  }

  .list {
    margin-top: @padding-base;
    list-style: none;
    padding-left: 0;

    li {
      padding: @padding-base / 3;
      border-bottom: 1px solid #eee;

      &:nth-child(odd) {
        background-color: #f9f9f9;
      }

      &:last-child {
        border-bottom: none;
      }

      a {
        color: darken(@primary-color, 15%);
        text-decoration: none;

        &:hover {
          color: @primary-color;
          text-decoration: underline;
        }
      }
    }
  }

  .box {
    .mixin-border(@color: @primary-color) {
      border: 2px dashed @color;
      border-radius: 8px;
      padding: @padding-base;
    }

    &.info {
      .mixin-border();
      background-color: lighten(@primary-color, 45%);
      margin-top: @padding-base;
    }

    &.warning {
      .mixin-border(#faad14);
      background-color: lighten(#faad14, 40%);
      margin-top: @padding-base;
    }
  }

  @media (max-width: 768px) {
    padding: @padding-base / 2;

    .title {
      font-size: 20px;
    }

    .button-group {
      flex-direction: column;
    }
  }
}
</style>
