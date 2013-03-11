describe("App Controller", function(){

	var scope, ls, compile;

	beforeEach(inject(function($controller, $rootScope, $compile) {
		scope = $rootScope.$new();
		scope.ctx = "../";
		ls = {
			get: jasmine.createSpy('get').andReturn(null),
			add: jasmine.createSpy('add'),
			remove: jasmine.createSpy('remove')
		};
		$controller(App, {$scope:scope, localStorageService: ls});
		scope.alarm.muted = true;
		compile = $compile;
	}));

	it("should be defined", function() {
		expect(App).toBeDefined();
	});

	it("should init plan with zero", function($controller) {
		expect(scope.plan.count).toEqual(0);
		expect(scope.plan.total).toEqual(0);
		expect(scope.plan.progress).toEqual([]);
	});

	it("should have initial setup", function() {
		expect(scope.setup.warmup).toEqual(180);
		expect(scope.setup.repeat).toEqual(8);
		expect(scope.setup.high).toEqual(10);
		expect(scope.setup.low).toEqual(10);
		expect(scope.setup.cooldown).toEqual(180);
	});

	it("should create correct plan", function(){
		scope.setup = {
			warmup: 1,
			repeat: 1,
			high: 1,
			low: 1,
			cooldown: 1
		};
		scope.$digest();
		expect(scope.plan.count).toEqual(0);
		expect(scope.plan.total).toEqual(4);
		var p = scope.plan.progress;
		expect(p.length).toEqual(4);
		expect(p[0].title).toEqual('Warm up');
		expect(p[0].max).toEqual(1);
		expect(p[0].value).toEqual(0);
		expect(p[0].start).toEqual(1);
		expect(p[0].end).toEqual(1);

		expect(p[1].title).toEqual('High');
		expect(p[1].max).toEqual(1);
		expect(p[1].value).toEqual(0);
		expect(p[1].start).toEqual(2);
		expect(p[1].end).toEqual(2);

		expect(p[2].title).toEqual('Low');
		expect(p[2].max).toEqual(1);
		expect(p[2].value).toEqual(0);
		expect(p[2].start).toEqual(3);
		expect(p[2].end).toEqual(3);

		expect(p[3].title).toEqual('Cool down');
		expect(p[3].max).toEqual(1);
		expect(p[3].value).toEqual(0);
		expect(p[3].start).toEqual(4);
		expect(p[3].end).toEqual(4);
	});

	it("it should tick timer", function() {
		jasmine.Clock.useMock();
		scope.setup = {
			warmup: 2, repeat: 2,
			high: 2, low: 2, cooldown: 2
		};
		scope.$digest();
		scope.start();
		expect(scope.plan.count).toEqual(0);
		expect(scope.plan.done).toEqual(false);
		expect(scope.plan.timer).toBeDefined();

		jasmine.Clock.tick(1000);
		expect(scope.plan.count).toEqual(1);
		expect(scope.plan.current).toEqual(scope.plan.progress[0]);
		expect(scope.plan.progress[0].value).toEqual(1);

		jasmine.Clock.tick(2000);
		expect(scope.plan.count).toEqual(3);
		expect(scope.plan.current).toEqual(scope.plan.progress[1]);
		expect(scope.plan.progress[1].value).toEqual(1);

		jasmine.Clock.tick(9000);
		expect(scope.plan.count).toEqual(12);
		expect(scope.plan.current).toEqual(scope.plan.progress[5]);
		expect(scope.plan.progress[1].value).toEqual(2);
		expect(scope.plan.done).toEqual(true);
		expect(scope.plan.timer).not.toBeDefined();
	});

	it("should clear", function() {
		scope.alarm.muted = true;
		spyOn(scope.alarm, 'pause');
		jasmine.Clock.useMock();
		scope.setup = {
			warmup: 2, repeat: 2,
			high: 2, low: 2, cooldown: 2
		};
		scope.$digest();
		scope.start();
		jasmine.Clock.tick(1000);
		scope.clear();
		expect(scope.plan.count).toEqual(0);
		expect(scope.plan.current).toEqual(null);
		expect(scope.plan.done).toEqual(false);
		expect(scope.plan.timer).not.toBeDefined();
		angular.forEach(scope.plan.progress, function(p){
			expect(p.value).toEqual(0);
		});
		expect(scope.alarm.pause).toHaveBeenCalled();
	});

	it("should play sound", function() {
		scope.alarm.muted = true;
		spyOn(scope.alarm, 'play');
		//spyOn(scope.alarm, 'pause');
		jasmine.Clock.useMock();
		scope.setup = {
			warmup: 10, repeat: 2,
			high: 2, low: 2, cooldown: 2
		};
		scope.$digest();
		scope.start();
		jasmine.Clock.tick(10001);
		expect(scope.alarm.play).toHaveBeenCalled();
	});

	describe("local storage", function() {

		var scope, ls;
		beforeEach(inject(function($rootScope) {
			scope = $rootScope.$new();
			scope.ctx = "../";
			ls = {
				get: jasmine.createSpy('get').andReturn(null),
				add: jasmine.createSpy('add'),
				remove: jasmine.createSpy('remove')
			};
			spyOn(window, 'alert');
			spyOn(window, 'prompt');
		}));

		it("should load default settings", inject(function($controller) {
			var s = {
				name:'hi',
				setup:{warmup: 2, repeat:2, high: 2, low:2, cooldown:2}
			};
			ls.get.andReturn(JSON.stringify([s]));
			$controller(App, {$scope:scope, localStorageService: ls})
			expect(scope.settings.length).toEqual(1);
			expect(scope.settings[0].name).toEqual('hi');
			expect(scope.settings[0].setup).toEqual(s.setup);
		}));

		it("should save current setting", inject(function($controller) {
			$controller(App, {$scope:scope, localStorageService: ls});
			scope.setup = {warmup:3, repeat:3, high:3, low:3, cooldown:3};
			window.prompt.andReturn("test name");
			expect(scope.settings.length).toEqual(0);
			scope.save();
			expect(scope.settings.length).toEqual(1);
			expect(scope.settings[0].name).toEqual("test name");
			expect(scope.settings[0].setup).toEqual(scope.setup);
			expect(ls.add).toHaveBeenCalledWith('settings', JSON.stringify(scope.settings));
		}));

		it("should not save if no name is provided", inject(function($controller) {
			$controller(App, {$scope:scope, localStorageService: ls});
			window.prompt.andReturn("");
			scope.save();
			expect(window.alert).toHaveBeenCalledWith("Please input a name");
		}));

		it("should load by index", inject(function($controller) {
			ls.get.andReturn(JSON.stringify([
				{name:'1', setup:{warmup:1,repeat:1,high:1,low:1,cooldown:1}},
				{name:'2', setup:{warmup:2,repeat:2,high:2,low:2,cooldown:2}}
			]));
			$controller(App, {$scope:scope, localStorageService: ls});
			scope.load(1);
			expect(scope.setup.warmup).toEqual(2);
		}));

		it("should remove by index", inject(function($controller) {
			ls.get.andReturn(JSON.stringify([
				{name:'1', setup:{warmup:1,repeat:1,high:1,low:1,cooldown:1}},
				{name:'2', setup:{warmup:2,repeat:2,high:2,low:2,cooldown:2}}
			]));
			$controller(App, {$scope:scope, localStorageService: ls});
			scope.remove(1);
			expect(scope.settings.length).toEqual(1);
			expect(ls.add).toHaveBeenCalledWith('settings', JSON.stringify(scope.settings));
		}));

		it("should clear all", inject(function($controller) {
			ls.get.andReturn(JSON.stringify([
				{name:'1', setup:{warmup:1,repeat:1,high:1,low:1,cooldown:1}},
				{name:'2', setup:{warmup:2,repeat:2,high:2,low:2,cooldown:2}}
			]));
			$controller(App, {$scope:scope, localStorageService: ls});
			expect(scope.settings.length).toEqual(2);
			scope.clearAll();
			expect(scope.settings.length).toEqual(0);
			expect(ls.remove).toHaveBeenCalledWith('settings');
		}));
	});

	// describe("audioDirective", function(){

	// 	var scope;

	// 	beforeEach(inject(function($rootScope){
	// 		scope = $rootScope;
	// 	}));

	// 	it("should compile directive for alarm", function() {
	// 		var $el = angular.element("<audio alarm='alarm'></audio>");
	// 		compile($el)(scope);
	// 		var elem = $el[0];
	// 		scope.$digest();
	// 		console.log(elem);

	// 		spyOn(elem, 'play');
	// 		spyOn(elem, 'pause');

	// 		scope.$apply(function(){
	// 			scope.alarm = "on";
	// 			expect(elem.play).toHaveBeenCalled();
	// 			expect(elem.pause).not.toHaveBeenCalled();
	// 		});

	// 		scope.$apply(function(){
	// 			scope.alarm = "off";
	// 			expect(elem.pause).toHaveBeenCalled();
	// 			expect(elem.currentTime).toEqual(0);
	// 		});
	// 	});

	// });

});