function App($scope, localStorageService){

	$scope.settings = JSON.parse(localStorageService.get('settings')) || [];

	$scope.setup = $scope.settings[0]? $scope.settings[0].setup : {
		warmup: 180,
		repeat: 8,
		high: 10,
		low: 10,
		cooldown: 180
	};

	$scope.plan = {
		count: 0, total:0,
		progress: []
	};

	$scope.save = function(){
		var name = prompt("Input a name for this setting:");
		if(!name){
			alert("Please input a name");
			return;
		}
		$scope.settings.push({name:name, setup: angular.copy($scope.setup)});
		localStorageService.add("settings", JSON.stringify($scope.settings));
	};

	$scope.load = function(index){
		$scope.setup = angular.copy($scope.settings[index].setup);
	};

	$scope.remove = function(index){
		var newSettings = [];
		angular.forEach($scope.settings, function(s, i){
			if(index !== i){
				newSettings.push(angular.copy(s));
			}
		});
		$scope.settings = newSettings;
		localStorageService.add("settings", JSON.stringify($scope.settings));
	};

	$scope.clearAll = function(){
		localStorageService.remove('settings');
		$scope.settings = [];
	};

	$scope.$watch('setup', function(setup){
		$scope.clear();
		var progress = [], total = 0;
		if(setup.warmup > 0){
			progress.push({title:'Warm up', max:setup.warmup, value:0, start:1, end: setup.warmup, type:'warmup'});
			total += setup.warmup;
		}
		for(var i=0; i<setup.repeat; i++){
			progress.push({title:'High', max:setup.high, value:0, start:total+1, end:total+setup.high, type:'high'});
			total += setup.high;
			progress.push({title:'Low', max:setup.low, value:0, start:total+1, end:total+setup.low, type:'low'});
			total += setup.low;
		}
		if(setup.cooldown > 0){
			progress.push({title:'Cool down', max:setup.cooldown, value:0, start:total+1, end:total+setup.cooldown, type:'cooldown'});
			total += setup.cooldown;
		}
		$scope.plan = {count:0, total:total, progress:progress};
	}, true);

	$scope.start = function(){
		$scope.plan.count = 0;
		$scope.plan.done = false;
		$scope.plan.timer = setInterval(function(){
			$scope.$apply(function(){
				$scope.plan.count = $scope.plan.count + 1;
				updateProgress();
				if($scope.plan.count == $scope.plan.total){
					clearInterval($scope.plan.timer);
					$scope.plan.done = true;
					delete $scope.plan.timer;
				}
			});
		}, 1000);
	};

	$scope.clear = function(){
		clearInterval($scope.plan.timer);
		delete $scope.plan.timer;
		$scope.plan.count = 0;
		$scope.plan.current = null;
		$scope.plan.done = false;
		$scope.alarm.pause();
		angular.forEach($scope.plan.progress, function(p){
			p.value = 0;
		});
	};

	$scope.alarm = new Audio(($scope.ctx || '') + "alarm.mp3");

	function updateProgress(){
		var progress = $scope.plan.progress,
			count = $scope.plan.count;
		for(var i=0; i<progress.length; i++){
			var p = progress[i];
			if(p.start <=  count && count <= p.end){
				if(p.start === count){
					playSound();
				}
				$scope.plan.current = p;
				p.value = count - p.start + 1;
				break;
			}
		}
	}

	function playSound(){
		$scope.currentTime = 0;
		$scope.alarm.play();
	}
}

/*
angular.module("hiit", []).directive("alarm", function(){
	console.log('call alarm factory');
	return function(scope, elem, attr){
		console.log('directive', attr);
		var flag = attr.alarm;
		scope.$watch(attr.alarm, function(value){
			console.log('enter watch', flag);
			if(value === 'on'){
				elem[0].play();
			}
			if(value === 'off'){
				elem[0].pause();
				elem[0].currentTime = 0;
			}
		});
	};
});
*/