function App($scope){

	$scope.warmup = 180;
	$scope.repeat = 8;
	$scope.high = 30;
	$scope.low = 10;
	$scope.cooldown = 180;

	$scope.getRepeat = function(){
		var arr = [], repeat = $scope.repeat || 0;
		for(var i=0; i<repeat; i++){
			arr.push(i);
		}
		return arr;
	};
	$scope.start = function(){
		setup();
		$scope.timer = setInterval(function(){
			$scope.$apply(function(){
				$scope.count = $scope.count + 1;
				$scope.current = getCurrent();
				if($scope.count == $scope.total){
					clearInterval($scope.timer);
				}
			});
		}, 1000);
	};
	$scope.clear = function(){
		clearInterval($scope.timer);
		delete $scope.timer;
		$scope.count = 0;
	};

	function setup(){
		$scope.total = $scope.warmup + $scope.cooldown + $scope.repeat*($scope.high + $scope.low);
		$scope.count = 0;
	}

	$scope.getTotal = function(){
		$scope.total = ($scope.warmup||0) + ($scope.cooldown||0) + ($scope.repeat||0)*(($scope.high||0) + ($scope.low||0));
		return $scope.total > 0;
	};

	$scope.progress = function(field, index){
		if(!$scope.timer) return 0;
		if(!field) return $scope.count || 0;

		if(field === "warmup"){
			return Math.min($scope.warmup, $scope.count);
		}
		if(field === "cooldown"){
			return Math.min($scope.cooldown, Math.max(0, $scope.count - $scope.warmup - $scope.repeat*($scope.high+$scope.low)));
		}
		if(field === "high"){
			return Math.min($scope.high, Math.max(0, $scope.count - $scope.warmup - index*($scope.high + $scope.low)));
		}
		if(field == "low"){
			return Math.min($scope.low, Math.max(0, $scope.count - $scope.warmup - index*($scope.high + $scope.low) - $scope.high));
		}
	};

	function getCurrent(){
		var count = $scope.count;
		if(count <= $scope.warmup){
			return {stage:'warmup', max:$scope.warmup, value:$scope.count, cssClass:'warmup'};
		}
		if(count > ($scope.warmup + $scope.repeat*($scope.high+$scope.low))){
			return {stage:'cooldown', max:$scope.cooldown, value: $scope.progress('cooldown'), cssClass:'cooldown'};
		}
		var intervalStage = Math.ceil((count - $scope.warmup) / ($scope.high+$scope.low)) ;
		var intervalCount = count - $scope.warmup - (intervalStage-1)*($scope.high + $scope.low);
		var isHigh = intervalCount <= $scope.high;
		return {
			stage: 'Interval ' + (intervalStage) + " - " + (isHigh? "High Intensity":"Low Intensity"),
			cssClass: isHigh? 'high':'low',
			value: isHigh? intervalCount : intervalCount - $scope.high,
			max: isHigh? $scope.high: $scope.low
		};
	}

	function getNum(input){
		var num = parseInt(input, 10);
		return isNaN(num)? 0 : num;
	}
}
