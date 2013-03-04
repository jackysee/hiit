function App($scope){

	$scope.setup = {
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

	$scope.$watch('setup', function(setup){
		var progress = [], total = 0;
		progress.push({title:'Warmup', max:setup.warmup, value:0, start:1, end: setup.warmup, type:'warmup'});
		total += setup.warmup;
		for(var i=0; i<setup.repeat; i++){
			progress.push({title:'High', max:setup.high, value:0, start:total+1, end:total+setup.high, type:'high'});
			total += setup.high;
			progress.push({title:'Low', max:setup.low, value:0, start:total+1, end:total+setup.low, type:'low'});
			total += setup.low;
		}
		progress.push({title:'Cooldown', max:setup.cooldown, value:0, start:total+1, end:total+setup.cooldown, type:'cooldown'});
		total += setup.cooldown;
		$scope.plan = {count:0, total:total, progress:progress};
	}, true);


	$scope.start = function(){
		$scope.plan.count = 0;
		$scope.plan.timer = setInterval(function(){
			$scope.$apply(function(){
				$scope.plan.count = $scope.plan.count + 1;
				updateProgress();
				if($scope.plan.count == $scope.plan.total){
					clearInterval($scope.plan.timer);
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
		angular.forEach($scope.plan.progress, function(p){
			p.value = 0;
		});
	};

	function updateProgress(){
		var progress = $scope.plan.progress,
			count = $scope.plan.count;
		for(var i=0; i<progress.length; i++){
			var p = progress[i];
			if(p.start <=  count && count <= p.end){
				$scope.plan.current = p;
				p.value = count - p.start + 1;
				break;
			}
		}
	}
}
