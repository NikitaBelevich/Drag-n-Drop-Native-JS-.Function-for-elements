'use strict';

const dragPanel = document.querySelector('.drag-panel');
const dragElement = dragPanel.firstElementChild;
const dropElement = document.querySelector('.drop-field');

const dragElements = dragPanel.children;

// Можем вызвать функцию для множества элементов
Array.from(dragElements).forEach((elem) => {
    makeElementDraggableNative(elem, 'drag-active2');
}); 
// makeElementDraggableNative(dragElement, 'drag-active2');

function makeElementDraggableNative(dragElement, classStyle, receivingSelector = '.droppable') {
    const namePrototypeDragElement = dragElement.__proto__.__proto__.constructor.name;

    try {
        // Проверяем по цепочке прототипов, является ли переданный аргумент экземпляром конструктора HTMLElement, то есть HTML узлом
        // Если это не HTML узел, тогда бросаем ошибку в консоль
        if (namePrototypeDragElement != 'HTMLElement') {
            throw new TypeError('The argument is not a DOM node');
        }
        // При наведении на Drag элемент видоизменяем курсор "можно взять"
        dragElement.addEventListener('mouseenter', function () {
            this.style.cursor = '-webkit-grab';
        });
        // Отменяем браузерный Drag’n’Drop во избежании конфликта
        dragElement.ondragstart = () => false; 
        // (1) Drag элемент захвачен и начинается перемещение
        dragElement.addEventListener('mousedown', function (event) {
            if (event.which != 1) return; // Выполняем алгоритм только если была нажата ЛКМ

            // Запоминаем отступы от краёв захваченного элемента до курсора
            const offsetX = event.offsetX; // отступ от левого края this до курсора
            const offsetY = event.offsetY; // отступ от верхнего края this до курсора
            const pageX = event.pageX; // Координата Х курсора относительно всего документа
            const pageY = event.pageY; // Координата Y курсора относительно всего документа

            // Переместим в body, чтобы элемент точно не оказался внутри родителя position:relative
            document.body.append(this);
            // И установим абсолютно спозиционированный элемент под курсор при захвате
            moveAt(pageX - 2, pageY - 2); // -2 это возможный неявный сдвиг который может плавать

            // Если строка не пустая и была передана в функцию (не undefined по умолчанию)
            // Если класс стилей не передан, всё будет работать, просто Drag элемент никак не видоизменится
            if (classStyle && classStyle != undefined) {
                this.classList.add(classStyle); // Тогда добавили стили для указания что Drag элемент активен
            }
            this.style.cursor = '-webkit-grabbing'; // В любом случае видоизменяем курсор

            function moveAt(pageX, pageY) {
                // позиционируем на координаты курсора за вычетом отступов от краёв элемента
                dragElement.style.cssText = `
                                        position: absolute;
                                        left: ${pageX - offsetX}px;
                                        top: ${pageY - offsetY}px;
                `;
            }
            // потенциальная цель переноса, над которой мы пролетаем прямо сейчас
            let currentDroppable = null;

            // (2) Drag элемент начинает перемещаться на новые координаты
            document.addEventListener('mousemove', onMouseMove);
            function onMouseMove(event) {
                // При каждом движении записываем координаты курсора
                const pageX = event.pageX;
                const pageY = event.pageY;
                // Позиционируем элемент при движении на координаты курсора
                moveAt(pageX, pageY);

                // TODO Определяем целевой элемент
                makeElementReceivingNative();
                function makeElementReceivingNative() {
                    dragElement.hidden = true;
                    let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
                    dragElement.hidden = false;
                    // если clientX/clientY за пределами окна, elementFromPoint вернёт null
                    if (!elemBelow) return;
                    // Проверка на пустой селектор (если селектор принимающего элемента пустая строка, то ничего не получится)
                    // А если селектор вовсе не передан, то у аргумента есть default значение
                    if (receivingSelector) {
                        // Потенциальные цели получения помечены классом droppable (Селектор передаётся 3 аргументом)
                        let droppableBelow = elemBelow.closest(receivingSelector);
                        if (currentDroppable != droppableBelow) {
                            // мы либо залетаем на цель, либо улетаем из неё
                            if (currentDroppable) {
                                // логика обработки процесса "вылета" из droppable
                                leaveDroppable(currentDroppable);
                            }
                            currentDroppable = droppableBelow;
                            if (currentDroppable) {
                                // логика обработки процесса, когда мы "влетаем" в элемент droppable
                                enterDroppable(currentDroppable);
                            }
                        }
                    }
                    
                }
                // TODO Определяем целевой элемент
            }
            // Обработка захода в droppable
            // Можем сделать что-то и с Drag элементом и с принимающим элементом
            function enterDroppable(elem) {
                elem.classList.add('drop-active2');
                // добавляем стилевое оформление
            }
            // Обработка ухода из droppable
            function leaveDroppable(elem) {
                elem.classList.remove('drop-active2');
                // убираем стилевое оформление
            }
            // (3) Drag элемент был отпущен
            document.onmouseup = function () {
                // Если принимающий элемент найден, т.е не null
                if (currentDroppable) {
                    currentDroppable.append(dragElement);
                    dragElement.style.position = 'static';
                }
                // Когда отпустили элемент, на document удаляем слушатель mousemove
                // А также удаляем этот слушатель mouseup
                this.removeEventListener('mousemove', onMouseMove);
                this.onmouseup = null;
                // Удалили стили активности если они ранее были добавлены
                if (dragElement.classList.contains(classStyle)) {
                    dragElement.classList.remove(classStyle); // Тогда удаляем его и возвращаем исходный стиль
                }
                dragElement.style.cursor = '-webkit-grab';
            }
        });
        // Для предотвращения случайного выделения текста
        dragElement.onmousedown = () => false; 

    } catch (error) {
        console.error(`TypeError: ${error.message}`);
    }
}