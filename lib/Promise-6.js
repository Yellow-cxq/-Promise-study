//自定义Promise函数模块：IIFE

(function (window) {

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    //Promise构造函数
    //executor执行器函数(同步执行)
    function Promise(executor) {
        const self = this       //保存当前promise对象
        self.status = PENDING //给promise对象指定status属性，初始值为pending
        self.data = undefined   //给promise对象指定一个用于存储结果数据的属性
        self.callbacks = []     //每个元素的结构:{onResolved() {}, onRejected() {}}

        function resolve(value) {
            //如果当前状态不是pending，直接结束
            if (self.status !== PENDING) {
                return
            }

            //将状态改为resolved
            self.status = RESOLVED
            //保存value数据
            self.data = value
            //如果有待执行的callback函数，立即异步执行回调
            if (self.callbacks.length > 0) {
                setTimeout(() => { //放入队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });   
                });
            }
        }

        function reject(reason) {
            //如果当前状态不是pending，直接结束
            if (self.status !== PENDING) {
                return
            }

             //将状态改为rejected
             self.status = REJECTED
             //保存value数据
             self.data = reason
             //如果有待执行的callback函数，立即异步执行回调
             if (self.callbacks.length > 0) {
                 setTimeout(() => { //放入队列中执行所有失败的回调
                     self.callbacks.forEach(callbacksObj => {
                         callbacksObj.onRejected(reason)
                     });   
                 });
             }
        }

        //立即同步执行执行器函数
        try {
            executor(resolve,reject) 
        } catch (error) {//如果执行器抛出异常，promise对象变为rejected
            reject(error)
        }
    }
    
    /*Promise原型对象的then方法
      指定成功和失败的回调函数
      返回一个新的promise对象
    */
    Promise.prototype.then = function (onResolved,onRejected) {
       
        //向后传递成功的value
        onResolved = typeof onResolved === 'function' ? onResolved : value => value
        //指定默认的失败的回调。实现异常传透的关键。向后传递失败的reason
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason}

        const self = this

        return new Promise((resolve,reject) => {

            //调用相应回调函数处理，根据结果改变return的promise的状态
            function handle(callback) {
                 /*
                     1.如果抛出异常，return的promise就会失败，reason就是error
                     2.如果回调函数返回不是promise，return的promise就会成功，value就是返回的值
                     3.如果回调函数返回是promise，return的promise结果就是这个promise的结果
                     */
                    try {
                        const result = callback(self.data) 
                        if (result instanceof Promise) {
                            //3.如果回调函数返回是promise，return的promise结果就是这个promise的结果
                             // result.then(
                             //     value => resolve(value), //当result成功时，让return的promise的也成功
                             //     reason => reject(reason) //当result失败时，让return的promise的也失败
                             // )
                             result.then(resolve,reject)
                        } else {
                             //2.如果回调函数返回不是promise，return的promise就会成功，value就是返回的值
                             resolve(result)
                        }
                      } catch (error) {
                         // 1.如果抛出异常，return的promise就会失败，reason就是error 
                         reject(error) 
                      }
            }

            if (self.status === PENDING) {
                //当前状态还是pending状态,将回调函数保存起来
                 self.callbacks.push({
                 onResolved (value) {
                    handle(onResolved)   
                 },
                 onRejected (reason) {
                    handle(onRejected)
                 }
             }) 
             } else if (self.status === RESOLVED) { //当前时resolved状态，异步执行onResolved并改变return的promise的状态
                 setTimeout(() => {
                    handle(onResolved)
                 })
             } else {//当前时rejected状态，异步执行onRejected并改变return的promise的状态
                 setTimeout(() => {
                    handle(onRejected)
                 })
             }
        })
    }

    /*Promise原型对象的catch方法
      指定失败的回调函数
      返回一个新的promise对象  
    */
    Promise.prototype.catch = function (onRejected) {
        const self = this
        return self.then(undefined,onRejected)
    }

    /*Promise函数对象的resolve方法
      返回一个指定结果的成功的promise 
    */
    Promise.resolve = function (value) {
        //返回一个成功/失败的Promise
        return new Promise((resolve,reject) => {
            //value是Promise
            if (value instanceof Promise) { //使用value的结果作为promise的结果
                value.then(resolve,reject)
            } else {
                //value不是Promise => promise变为成功，数据是value
                resolve(value)
            }
            
        })
    }

    /*Promise函数对象的reject方法
      返回一个指定结果的失败的promise
    */
    Promise.reject = function (reason) {
        //返回一个失败的Promise
        return new Promise((resolve,reject) => {
            reject(reason)
        })
    }

    /*Promise函数对象的all方法
      返回一个promise，只有当所有promise都成功时才成功，否则失败  
    */
    Promise.all = function (promises) {

    }

    /*Promise函数对象的race方法
      返回一个promise，其结果由第一个完成的promise决定
    */
    Promise.race = function (promises) {

    }


    //向外暴露Promise函数
    window.Promise = Promise
})(window)