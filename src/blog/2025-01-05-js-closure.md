---
title: "클로저는 환경을 어떻게 기억할까?"
author: gominzip
pubDate: 2025-01-05
description: "This post will show up on its own!"
image:
  url: "https://docs.astro.build/default-og-image.png"
  alt: "The word astro against an illustration of planets and stars."
tags: ["astro", "successes"]
---

> 📚 [모던 자바스크립트 Deep Dive](https://wikibook.co.kr/mjs/)의 23,24장을 학습하며 정리한 내용을 기반으로 작성되었습니다.

과거 함수형 프로그래밍을 학습하거나 useState 훅을 비슷하게 구현해보면서, 클로저를 잘 활용하려면 자바스크립트 엔진이 각 스코프에 대해 환경을 어떻게 생성하고 관리하는지 이해하는 것이 중요하다고 느꼈다.

따라서 이번 글에서는 자바스크립트의 실행 컨텍스트와 렉시컬 환경이 어떻게 작동하는지, 그리고 이를 기반으로 클로저가 어떻게 형성되고 동작하는지를 설명해 보고자 한다.

# 실행 컨텍스트와 렉시컬 환경 이해하기 🤔

클로저의 동작 방식을 이해하려면 실행 컨텍스트가 생성되고 동작하는 과정을 아는 게 중요하다.

---

## 소스 코드의 평가와 실행

자바스크립트는 소스 코드를 실행하기 전에 **평가 단계**를 거쳐 실행 컨텍스트를 생성한다. 이 과정은 아래와 같은 흐름으로 진행된다.

1. **소스 코드 평가 단계에서 실행 컨텍스트 생성**
2. 변수와 함수 등의 **선언문만 먼저 실행**해서 생성된 변수나 함수 식별자를 키로 **실행 컨텍스트가 관리하는 스코프(렉시컬 환경의 환경 레코드)**에 등록한다.
3. 실행 과정에서 필요한 정보(변수, 함수)를 **실행 컨텍스트가 관리하는 스코프에서 검색**해서 가져온다. 실행 결과는 다시 실행 컨텍스트가 관리하는 스코프에 등록한다.

우선 실행 컨텍스트는 렉시컬 환경을 참조한다는 정도만 알고 넘어가자!

## 렉시컬 환경(Lexical Environment)의 구성

렉시컬 환경은 두 가지 요소로 구성된다.

- **환경 레코드(Environment Record)**  
  스코프에 포함된 식별자를 등록하고, 등록된 식별자에 바인딩된 값을 관리하는 저장소다. 소스 코드의 타입에 따라 관리하는 내용이 달라진다.
- **외부 렉시컬 환경에 대한 참조(Outer Lexical Environment Reference)**  
  상위 스코프를 가리킨다. 이를 통해 단방향 링크드리스트인 스코프 체인을 구현한다.

---

## 예제로 알아보자

```js
var x = 1;
const y = 2;

function foo(a) {
  var x = 3;
  const y = 4;

  function bar(b) {
    const z = 5;
    console.log(a + b + x + y + z);
  }
  bar(10);
}

foo(20);
```

![](https://velog.velcdn.com/images/gominzip/post/242f5655-6035-48ec-b7a5-6a3b6ce2f771/image.png)

### 실행 과정

1. **전역 객체 생성**  
   빌트인 메서드, 빌트인 객체, Web API 등을 포함한 전역 객체가 생성된다.

2. **전역 코드 평가**

   - 전역 실행 컨텍스트 생성 후 실행 컨텍스트 스택에 푸시된다.
   - 전역 렉시컬 환경이 생성된다.
     1. **전역 환경 레코드 생성**
        - 객체 환경 레코드: `var`와 `function`으로 선언된 변수와 함수가 포함된다. 전역 객체의 프로퍼티와 메서드로도 접근할 수 있다(`window.x`처럼).
        - 선언적 환경 레코드: `let`과 `const`로 선언된 변수가 포함된다.
     2. **this 바인딩**
     3. **외부 렉시컬 환경에 대한 참조 결정**
        - 함수는 정의된 위치에 따라 상위 스코프가 결정되며, JS 엔진은 함수의 상위 스코프를 함수 객체의 내부 슬롯 `[[Environment]]`에 저장한다.
        - 전역 렉시컬 환경은 스코프 체인의 종점이므로 외부 렉시컬 환경 참조는 `null`이다.

3. **전역 코드 실행**

   - 전역 변수와 함수가 실행된다.

4. **foo 함수 평가 및 실행**

   - `foo` 함수 실행 컨텍스트가 생성되고, 렉시컬 환경이 구성된다.
   - `foo` 함수 내부에서 `bar` 함수를 평가한다.

5. **bar 함수 평가 및 실행**

   - `bar` 함수 실행 컨텍스트가 생성되고, 렉시컬 환경이 구성된다.
   - `console` 식별자를 외부 렉시컬 환경을 따라가며 검색한다. 전역 환경에서 `console` 식별자를 찾고, `log` 메서드를 호출한다.
   - `a`, `b`, `x`, `y`, `z`는 각각의 렉시컬 환경에서 검색된다.

6. **코드 실행 종료**
   - 실행 컨텍스트가 스택에서 순차적으로 제거된다.
   - 특정 실행 컨텍스트가 제거되더라도, 해당 함수의 렉시컬 환경이 참조되고 있다면 메모리에서 해제되지 않는다. (참조되지 않을 때만 가비지컬렉터가 메모리에서 해제한다.)

---

실행 컨텍스트와 렉시컬 환경은 자바스크립트의 스코프와 클로저를 이해하는 데 중요한 개념이다. 이를 잘 이해하면 클로저를 효과적으로 활용할 수 있다.

# 클로저 이해하기 🚀

클로저에 대한 [MDN의 정의](https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures)는 다음과 같다.

> “A closure is the combination of a function and the lexical environment within which that function was declared.”
> 클로저는 함수와 그 함수가 선언됐을 때의 렉시컬 환경(Lexical environment)과의 조합이다.

## 렉시컬 스코프

예제를 통해 정의에서 말하는 `그 함수가 선언된 렉시컬 환경`이 무엇인지 이해해보자.

```jsx
const x = 1;

function funcA() {
  const x = 10;

  function funcB() {
    console.log(x); // 10
  }
  funcB();
  funcC();
}

function funcC() {
  console.log(x); // 1
}

funcA();
```

위 코드에서 funcA에서 선언된 funcB는 funcA의 렉시컬 환경 레코드에 저장된 x(10)에 접근해 해당 값을 출력할 수 있다.

하지만 전역에 선언된 funcB는 funcA에서 호출되었다 하더라도 funcA의 렉시컬 환경을 알 수 없으며, 자신이 선언된 전역의 렉시컬 환경 레코드에 저장된 x(1)에 접근하게 된다.

이처럼 JS 엔진은 함수를 어디서 호출했는지가 아니라 **함수를 어디에 정의했는지에 따라 상위 스코프를 결정**한다. 이를 **렉시컬 스코프(정적 스코프)**라 한다.

## 클로저와 렉시컬 환경

```jsx
const x = 1;

function outer() {
  const x = 10;
  const inner = function () {
    console.log(x);
  };
  return inner;
}

const innerFunc = outer();
innerFunc(); // 10
```

outer 함수를 호출하면 inner를 반환하고 있으며, outer 함수의 실행이 종료되면 실행 컨텍스트 스택에서 제거되며 생명 주기를 마감한다.

이때 outer 함수의 실행 컨텍스트가 제거되었기 때문에 해당 컨텍스트의 렉시컬 환경 레코드의 x가 유효하지 않을 것이라 생각될 수 있다. 하지만 지역 변수 x는 기대한 값을 출력한다!

이처럼 **외부 함수보다 중첩 함수가 더 오래 유지되는 경우 중첩 함수는 이미 생명 주기가 종료한 외부 함수의 변수를 참조할 수 있다. 이러한 중첩 함수를 클로저라고 부른다.**

그렇다면 어떻게 컨텍스트가 제거됨에도 해당 렉시컬 환경 레코드의 값을 중첩 함수가 알 수 있는 것일까?

## 함수의 내부 슬롯 [[Environment]]

외부 렉시컬 환경에 대한 참조 할당에 대해 논의할 때 “JS엔진은 함수의 상위스코프(현재 실행 중인 실행 컨텍스트의 렉시컬 환경)를 함수 객체의 내부 슬롯 `[[Environment]]`에 저장한다.”라고 언급했었다.

또한, 렉시컬 환경은 실행 컨텍스트가 제거될 때 사라지는 것이 아닌 “해당 함수 렉시컬 환경이 **누군가에게 참조되지 않을 때 가비지 콜렉터가 해제**”한다고 했었다.

즉 중첩 함수가 제거된 외부 함수의 변수를 참조할 수 있었던 이유는 중첩함수가 자신의 내부 슬롯인 `[[Environment]]` 에서 상위 스코프의 렉시컬 환경을 참조하고 있었기 때문이다!
이로 인해 outer 함수의 실행 컨텍스트가 제거되더라도 outer 함수의 렉시컬 환경은 남아있을 수 있었던 것이다.

![](https://velog.velcdn.com/images/gominzip/post/70648532-d2c3-47c4-980f-d7076786aac8/image.png)

### 클로저 예시

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script>
      function foo() {
        const x = 1;
        const y = 2;

        function bar() {
          debugger;
          console.log(x);
        }
        return bar;
      }

      const bar = foo();
      bar();
    </script>
  </body>
</html>
```

![](https://velog.velcdn.com/images/gominzip/post/ddd8d94c-f645-4fd3-a376-048be1ff34a4/image.png)

위와 같이 클로저는 **1. 중첩 함수가 상위 스코프의 식별자를 참조하고 있고**, **2. 중첩 함수가 외부 함수보다 더 오래 유지**되는 경우에 한정하는 것이 일반적이다.

불필요한 메모리 점유를 걱정할 수도 있겠지만 JS 엔진의 최적화가 잘 되어있기 때문에 기억해야할 식별자만 기억하며 이는 불필요한 메모리 낭비라고 할 수 없다.

## 클로저의 활용

클로저는 **상태를 안전하게 은닉**하고, **상태 변경을 특정 함수에만 허용**하여 의도치 않게 상태가 변경되는 것을 방지하는 데 유용하게 활용된다. 클로저의 강력한 기능 덕분에 함수형 프로그래밍 및 상태 관리에서 큰 역할을 한다.

아래는 클로저 활용의 예시이다.

### 함수형 프로그래밍

함수형 프로그래밍에서는 함수가 **상태를 변경하는 유일한 방법**이 되며, 클로저는 상태를 안전하게 캡슐화하는 데 중요한 역할을 한다. 위의 예제에서는 `makeCounter`라는 함수가 클로저를 활용해 상태를 은닉하고 있다.

```jsx
function makeCounter(aux) {
  let counter = 0; // 외부 함수에서 상태 관리

  return function () {
    counter = aux(counter); // 상태를 변경하는 함수
    return counter; // 변경된 상태 반환
  };
}

function increase(n) {
  return ++n;
}

function decrease(n) {
  return --n;
}

const increaser = makeCounter(increase);

console.log(increaser()); // 1
console.log(increaser()); // 2

const decreaser = makeCounter(decrease);
console.log(decreaser()); // -1
console.log(decreaser()); // -2
```

1. `makeCounter` 함수는 **`counter`**라는 변수를 가지고 있으며, 이 변수는 함수 외부에서 접근할 수 없다.
2. 반환되는 함수는 **`counter`**를 변경하는 유일한 방법인 **`aux(counter)`**를 통해 `counter`의 값을 조작한다.
3. 외부에서는 `counter` 값을 직접 변경할 수 없고, `increase` 또는 `decrease`와 같은 함수만을 통해 상태 변경이 이루어진다. 이렇게 클로저를 사용하면, 상태가 의도치 않게 변경되는 것을 방지하고, 상태 관리가 안전하게 이루어진다.

### React의 `useState`

`useState` 훅은 리액트에서 상태를 관리하기 위해 사용되며, 클로저와 비슷한 방식으로 동작한다. `useState`는 상태 값을 반환하고, 이 값을 변경하는 함수를 반환하는데, 반환된 함수는 상태를 변경하는 유일한 방법이 된다.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1); // 상태 변경 함수만으로 상태를 업데이트
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increase</button>
    </div>
  );
}
```

- `useState(0)`에서 반환되는 `count`는 외부에서 직접 수정할 수 없다.
- 상태를 수정하는 유일한 방법은 `setCount` 함수를 호출하는 것뿐이다.
- `setCount`는 내부적으로 클로저를 활용하여 상태 값을 변경하고, 변경된 상태 값을 컴포넌트에 반영한다.

이처럼 `useState`는 클로저를 활용하여 상태를 은닉하고, 상태를 변경할 수 있는 함수만을 외부에 제공한다. 클로저 덕분에 리액트는 상태 관리가 안전하고 예측 가능한 방식으로 이루어질 수 있다.
useState의 내부동작과 구현에 관련하여서는 추가적으로 포스팅할 예정이다!

---

## 마치며 💭

클로저는 처음 접했을 때 난해할 수 있지만, 실행 컨텍스트와 렉시컬 환경에 대한 이해를 충분히 해둔다면 그 동작 원리를 파악하는 데 큰 어려움은 없을 듯 하다.
향후 함수형 프로그래밍 관련 책을 읽을 예정인데, 이번 학습 내용을 잊지 않고 잘 활용해보고자 한다!
