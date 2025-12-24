// 简单的自定义对话框系统
// 用于替代浏览器原生的 alert 和 confirm
const Dialog = {
  // 显示 alert 对话框
  alert(message, title = '💡 Notice') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        buttons: [
          {
            text: 'OK',
            className: 'primary-btn',
            onClick: () => {
              this.hide();
              resolve(true);
            }
          }
        ]
      });
    });
  },

  // 显示 confirm 对话框
  confirm(message, title = '❓ Confirm') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        buttons: [
          {
            text: 'Cancel',
            className: 'secondary-btn',
            onClick: () => {
              this.hide();
              resolve(false);
            }
          },
          {
            text: 'OK',
            className: 'primary-btn',
            onClick: () => {
              this.hide();
              resolve(true);
            }
          }
        ]
      });
    });
  },

  // 显示自定义对话框
  show({ title, message, buttons }) {
    // 创建对话框元素
    const modal = document.createElement('div');
    modal.id = 'customDialog';
    modal.className = 'modal show';

    const content = document.createElement('div');
    content.className = 'modal-content';

    // 标题
    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.style.marginTop = '0';
      titleEl.style.marginBottom = '15px';
      titleEl.style.fontSize = '1.3em';
      titleEl.style.color = '#333';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    // 消息内容
    const messageEl = document.createElement('p');
    messageEl.style.color = '#666';
    messageEl.style.lineHeight = '1.6';
    messageEl.style.marginBottom = '25px';
    messageEl.style.whiteSpace = 'pre-wrap';
    messageEl.textContent = message;
    content.appendChild(messageEl);

    // 按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = btn.className;
      button.textContent = btn.text;
      button.onclick = btn.onClick;
      btnContainer.appendChild(button);
    });

    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭（仅对 confirm 类型）
    if (buttons.length > 1) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          buttons[0].onClick(); // 触发取消按钮
        }
      };
    }

    // 添加键盘支持
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && buttons.length > 1) {
        buttons[0].onClick(); // ESC 键触发取消
      } else if (e.key === 'Enter') {
        buttons[buttons.length - 1].onClick(); // Enter 键触发确认
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // 保存事件监听器以便清理
    modal._keyHandler = handleKeyPress;
  },

  // 隐藏对话框
  hide() {
    const dialog = document.getElementById('customDialog');
    if (dialog) {
      // 清理键盘事件监听器
      if (dialog._keyHandler) {
        document.removeEventListener('keydown', dialog._keyHandler);
      }
      dialog.remove();
    }
  }
};

// 全局导出
window.Dialog = Dialog;
